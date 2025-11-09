using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.DTO;
using ProcurePro.Api.Models;
using ProcurePro.Api.Modules;
using ProcurePro.Api.Services;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VendorsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly INotificationService _notify;
        private readonly UserManager<ApplicationUser> _users;

        public VendorsController(ApplicationDbContext db, INotificationService notify, UserManager<ApplicationUser> users)
        {
            _db = db;
            _notify = notify;
            _users = users;
        }

        [HttpGet]
        [Authorize(Policy = "RequireProcurementManager")]
        public async Task<ActionResult<IEnumerable<VendorSummaryDto>>> GetAll()
        {
            var vendors = await _db.Vendors
                .AsNoTracking()
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new VendorSummaryDto(
                    v.Id,
                    v.CompanyName,
                    v.Email,
                    v.Phone,
                    v.Category,
                    v.IsActive,
                    v.VerificationStatus,
                    v.CreatedAt,
                    v.PerformanceRating))
                .ToListAsync();

            return Ok(vendors);
        }

        [HttpGet("{id:guid}")]
        [Authorize(Policy = "RequireProcurementManager")]
        public async Task<ActionResult<VendorDetailDto>> Get(Guid id)
        {
            var vendor = await _db.Vendors
                .AsNoTracking()
                .Include(v => v.Documents)
                .Include(v => v.StatusHistory)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (vendor == null) return NotFound();

            var purchaseOrders = await (from po in _db.PurchaseOrders.AsNoTracking()
                                        join bid in _db.Bids.AsNoTracking() on po.BidId equals bid.Id
                                        where bid.VendorId == id
                                        orderby po.CreatedAt descending
                                        select new VendorPurchaseOrderDto(po.Id, po.BidId, po.Status.ToString(), po.CreatedAt))
                                        .ToListAsync();

            var invoices = await (from invoice in _db.Invoices.AsNoTracking()
                                  join po in _db.PurchaseOrders.AsNoTracking() on invoice.PurchaseOrderId equals po.Id
                                  join bid in _db.Bids.AsNoTracking() on po.BidId equals bid.Id
                                  where bid.VendorId == id
                                  orderby invoice.SubmittedAt descending
                                  select new VendorInvoiceDto(invoice.Id, invoice.PurchaseOrderId, invoice.Amount, invoice.PaymentStatus.ToString(), invoice.SubmittedAt))
                                  .ToListAsync();

            var history = new VendorHistoryDto(purchaseOrders, invoices);
            var docs = vendor.Documents
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new VendorDocumentDto(d.Id, d.DocumentType, d.FileName, d.StorageUrl, d.IsVerified, d.UploadedAt, d.Notes))
                .ToList();
            var statusHistory = vendor.StatusHistory
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new VendorStatusHistoryDto(h.Id, h.Status, h.ChangedAt, h.Remarks, h.ChangedByUserId))
                .ToList();

            var response = new VendorDetailDto(
                new VendorSummaryDto(vendor.Id, vendor.CompanyName, vendor.Email, vendor.Phone, vendor.Category, vendor.IsActive, vendor.VerificationStatus, vendor.CreatedAt, vendor.PerformanceRating),
                history,
                docs,
                statusHistory);

            return Ok(response);
        }

        [HttpPost("self/kyc")]
        [Authorize(Roles = "Vendor")]
        public async Task<ActionResult> SubmitKyc([FromBody] SubmitVendorKycRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _users.FindByIdAsync(userId);
            if (user?.VendorId is null) return Forbid();

            var vendor = await _db.Vendors
                .Include(v => v.Documents)
                .FirstOrDefaultAsync(v => v.Id == user.VendorId.Value);

            if (vendor == null) return NotFound();

            vendor.Phone = request.Phone ?? vendor.Phone;
            vendor.Address = request.Address ?? vendor.Address;
            vendor.TaxId = request.TaxId ?? vendor.TaxId;
            vendor.Website = request.Website ?? vendor.Website;
            vendor.VerificationStatus = VendorVerificationStatus.PendingReview;
            vendor.VerificationRemarks = request.Notes;
            vendor.IsActive = false;

            _db.VendorDocuments.RemoveRange(vendor.Documents);

            if (request.Documents != null && request.Documents.Count > 0)
            {
                foreach (var doc in request.Documents)
                {
                    _db.VendorDocuments.Add(new VendorDocument
                    {
                        Id = Guid.NewGuid(),
                        VendorId = vendor.Id,
                        DocumentType = doc.DocumentType,
                        FileName = doc.FileName,
                        StorageUrl = doc.StorageUrl,
                        Notes = doc.Notes,
                        UploadedByUserId = userId,
                        IsVerified = false
                    });
                }
            }

            await AddStatusHistoryAsync(vendor.Id, VendorVerificationStatus.PendingReview, "KYC documents submitted by vendor.", userId);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id:guid}/review")]
        [Authorize(Policy = "RequireProcurementManager")]
        public async Task<ActionResult> Review(Guid id, [FromBody] ReviewVendorRequest request)
        {
            if (request.Status != VendorVerificationStatus.Approved && request.Status != VendorVerificationStatus.Rejected)
                return BadRequest("Only Approved or Rejected statuses are allowed for review.");

            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null) return NotFound();

            vendor.VerificationStatus = request.Status;
            vendor.VerificationRemarks = request.Remarks;
            vendor.VerifiedAt = DateTime.UtcNow;
            vendor.VerifiedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            vendor.IsActive = request.Status == VendorVerificationStatus.Approved;

            await AddStatusHistoryAsync(vendor.Id, request.Status, request.Remarks, vendor.VerifiedByUserId);
            await _db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(vendor.Email))
            {
                var subject = request.Status == VendorVerificationStatus.Approved ? "Vendor profile approved" : "Vendor profile rejected";
                var message = request.Status == VendorVerificationStatus.Approved
                    ? "Your vendor profile has been approved. You may now participate in procurement activities."
                    : $"Your vendor profile has been rejected. Remarks: {request.Remarks}";
                await _notify.SendEmailAsync(vendor.Email, subject, message);
            }

            return NoContent();
        }

        [HttpPost("{id:guid}/suspend")]
        [Authorize(Policy = "RequireProcurementManager")]
        public async Task<ActionResult> Suspend(Guid id, [FromBody] UpdateVendorStatusRequest request)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null) return NotFound();

            vendor.VerificationStatus = VendorVerificationStatus.Suspended;
            vendor.IsActive = false;
            vendor.VerificationRemarks = request.Remarks;
            await AddStatusHistoryAsync(id, VendorVerificationStatus.Suspended, request.Remarks, User.FindFirstValue(ClaimTypes.NameIdentifier));
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id:guid}/blacklist")]
        [Authorize(Policy = "RequireProcurementManager")]
        public async Task<ActionResult> Blacklist(Guid id, [FromBody] UpdateVendorStatusRequest request)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null) return NotFound();

            vendor.VerificationStatus = VendorVerificationStatus.Blacklisted;
            vendor.IsActive = false;
            vendor.VerificationRemarks = request.Remarks;
            await AddStatusHistoryAsync(id, VendorVerificationStatus.Blacklisted, request.Remarks, User.FindFirstValue(ClaimTypes.NameIdentifier));
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id:guid}/reinstate")]
        [Authorize(Policy = "RequireProcurementManager")]
        public async Task<ActionResult> Reinstate(Guid id, [FromBody] UpdateVendorStatusRequest request)
        {
            var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == id);
            if (vendor == null) return NotFound();

            vendor.VerificationStatus = VendorVerificationStatus.Approved;
            vendor.IsActive = true;
            vendor.VerificationRemarks = request.Remarks;
            vendor.VerifiedAt = DateTime.UtcNow;
            vendor.VerifiedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            await AddStatusHistoryAsync(id, VendorVerificationStatus.Approved, request.Remarks, vendor.VerifiedByUserId);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        private Task AddStatusHistoryAsync(Guid vendorId, VendorVerificationStatus status, string? remarks, string? changedByUserId)
        {
            _db.VendorStatusHistories.Add(new VendorStatusHistory
            {
                Id = Guid.NewGuid(),
                VendorId = vendorId,
                Status = status,
                Remarks = remarks,
                ChangedByUserId = changedByUserId,
                ChangedAt = DateTime.UtcNow
            });
            return Task.CompletedTask;
        }
    }
}
