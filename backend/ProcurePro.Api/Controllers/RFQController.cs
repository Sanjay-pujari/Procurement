using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.DTO;
using ProcurePro.Api.Modules;
using ProcurePro.Api.Services;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RFQController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notification;

        public RFQController(ApplicationDbContext context, INotificationService notification)
        {
            _context = context;
            _notification = notification;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RfqSummaryDto>>> GetAll()
        {
            var rfqs = await _context.RFQs
                .AsNoTracking()
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.ReferenceNumber,
                    r.Title,
                    r.Status,
                    r.DueDate,
                    r.CreatedAt,
                    ItemCount = r.Items.Count,
                    VendorCount = r.RFQVendors.Count,
                    r.PurchaseRequisitionId
                })
                .ToListAsync();

            var prNumbers = await _context.PurchaseRequisitions
                .Where(pr => rfqs.Select(r => r.PurchaseRequisitionId).Contains(pr.Id))
                .Select(pr => new { pr.Id, pr.PrNumber })
                .ToDictionaryAsync(x => x.Id, x => x.PrNumber);

            var summaries = rfqs.Select(r => new RfqSummaryDto(
                r.Id,
                r.ReferenceNumber,
                r.Title,
                r.Status,
                r.DueDate,
                r.CreatedAt,
                r.ItemCount,
                r.VendorCount,
                r.PurchaseRequisitionId.HasValue && prNumbers.ContainsKey(r.PurchaseRequisitionId.Value)
                    ? prNumbers[r.PurchaseRequisitionId.Value]
                    : null));

            return Ok(summaries);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<RfqDetailDto>> Get(Guid id)
        {
            var rfq = await _context.RFQs
                .AsNoTracking()
                .Include(r => r.Items)
                .Include(r => r.Attachments)
                .Include(r => r.RFQVendors)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rfq == null) return NotFound();

            var vendorInfos = await _context.Vendors
                .Where(v => rfq.RFQVendors.Select(rv => rv.VendorId).Contains(v.Id))
                .Select(v => new { v.Id, v.CompanyName })
                .ToDictionaryAsync(v => v.Id, v => v.CompanyName);

            var prNumber = rfq.PurchaseRequisitionId.HasValue
                ? await _context.PurchaseRequisitions
                    .Where(pr => pr.Id == rfq.PurchaseRequisitionId.Value)
                    .Select(pr => pr.PrNumber)
                    .FirstOrDefaultAsync()
                : null;

            return Ok(MapDetail(rfq, vendorInfos, prNumber));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<RfqDetailDto>> Create([FromBody] CreateRfqRequest request)
        {
            if (request.Items == null || !request.Items.Any())
                return BadRequest("RFQ requires at least one item.");
            if (request.Vendors == null || !request.Vendors.Any())
                return BadRequest("RFQ requires at least one vendor.");

            var rfq = new RFQ
            {
                Id = Guid.NewGuid(),
                PurchaseRequisitionId = request.PurchaseRequisitionId,
                ReferenceNumber = await GenerateReferenceAsync(),
                Title = request.Title,
                Terms = request.Terms,
                DueDate = request.DueDate,
                Status = RFQStatus.Draft,
                Items = request.Items.Select(i => new RFQItem
                {
                    Id = Guid.NewGuid(),
                    Description = i.Description,
                    Specification = i.Specification,
                    Quantity = i.Quantity,
                    Unit = i.Unit
                }).ToList(),
                Attachments = request.Attachments?.Select(att => new RFQAttachment
                {
                    Id = Guid.NewGuid(),
                    FileName = att.FileName,
                    StorageUrl = att.StorageUrl,
                    UploadedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system"
                }).ToList() ?? new List<RFQAttachment>(),
                RFQVendors = request.Vendors.Select(v => new RFQVendor
                {
                    Id = Guid.NewGuid(),
                    VendorId = v.VendorId,
                    Status = RfqVendorStatus.Pending,
                    Notes = v.Notes
                }).ToList()
            };

            _context.RFQs.Add(rfq);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = rfq.Id }, await LoadDetailAsync(rfq.Id));
        }

        [HttpPost("convert")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<RfqDetailDto>> ConvertFromPurchaseRequisition([FromBody] ConvertPrToRfqRequest request)
        {
            var pr = await _context.PurchaseRequisitions
                .Include(pr => pr.Items)
                .FirstOrDefaultAsync(pr => pr.Id == request.PurchaseRequisitionId);
            if (pr == null) return NotFound("Purchase requisition not found.");
            if (pr.Status != PurchaseRequisitionStatus.Approved)
                return BadRequest("Purchase requisition must be approved before converting to RFQ.");

            if (request.Vendors == null || !request.Vendors.Any())
                return BadRequest("Specify at least one vendor.");

            var rfq = new RFQ
            {
                Id = Guid.NewGuid(),
                PurchaseRequisitionId = pr.Id,
                ReferenceNumber = await GenerateReferenceAsync(),
                Title = request.Title,
                Terms = request.Terms,
                DueDate = request.DueDate,
                Status = RFQStatus.Draft,
                Items = pr.Items.Select(item => new RFQItem
                {
                    Id = Guid.NewGuid(),
                    Description = item.ItemName,
                    Specification = item.Specification,
                    Quantity = item.Quantity,
                    Unit = item.UnitOfMeasure
                }).ToList(),
                Attachments = request.Attachments?.Select(att => new RFQAttachment
                {
                    Id = Guid.NewGuid(),
                    FileName = att.FileName,
                    StorageUrl = att.StorageUrl,
                    UploadedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system"
                }).ToList() ?? new List<RFQAttachment>(),
                RFQVendors = request.Vendors.Select(v => new RFQVendor
                {
                    Id = Guid.NewGuid(),
                    VendorId = v.VendorId,
                    Status = RfqVendorStatus.Pending,
                    Notes = v.Notes
                }).ToList()
            };

            _context.RFQs.Add(rfq);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = rfq.Id }, await LoadDetailAsync(rfq.Id));
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult> Update(Guid id, [FromBody] UpdateRfqRequest request)
        {
            var rfq = await _context.RFQs
                .Include(r => r.Items)
                .Include(r => r.Attachments)
                .Include(r => r.RFQVendors)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (rfq == null) return NotFound();
            if (rfq.Status != RFQStatus.Draft)
                return BadRequest("Only draft RFQs can be edited.");

            rfq.Title = request.Title;
            rfq.Terms = request.Terms;
            rfq.DueDate = request.DueDate;

            _context.RFQItems.RemoveRange(rfq.Items);
            rfq.Items = request.Items.Select(i => new RFQItem
            {
                Id = Guid.NewGuid(),
                RFQId = id,
                Description = i.Description,
                Specification = i.Specification,
                Quantity = i.Quantity,
                Unit = i.Unit
            }).ToList();

            _context.RFQAttachments.RemoveRange(rfq.Attachments);
            rfq.Attachments = request.Attachments?.Select(att => new RFQAttachment
            {
                Id = Guid.NewGuid(),
                RFQId = id,
                FileName = att.FileName,
                StorageUrl = att.StorageUrl,
                UploadedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system"
            }).ToList() ?? new List<RFQAttachment>();

            _context.RFQVendors.RemoveRange(rfq.RFQVendors);
            rfq.RFQVendors = request.Vendors.Select(v => new RFQVendor
            {
                Id = Guid.NewGuid(),
                RFQId = id,
                VendorId = v.VendorId,
                Status = RfqVendorStatus.Pending,
                Notes = v.Notes
            }).ToList();

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id:guid}/publish")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult> Publish(Guid id, [FromBody] SendInvitationRequest? request)
        {
            var rfq = await _context.RFQs
                .Include(r => r.RFQVendors)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (rfq == null) return NotFound();

            if (rfq.Status != RFQStatus.Draft)
                return BadRequest("Only draft RFQs can be published.");

            rfq.Status = RFQStatus.Published;
            rfq.PublishedAt = DateTime.UtcNow;

            await SendInvitationsInternalAsync(rfq, request?.VendorIds);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id:guid}/close")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult> Close(Guid id)
        {
            var rfq = await _context.RFQs.FirstOrDefaultAsync(r => r.Id == id);
            if (rfq == null) return NotFound();

            if (rfq.Status != RFQStatus.Published)
                return BadRequest("Only published RFQs can be closed.");

            rfq.Status = RFQStatus.Closed;
            rfq.ClosedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id:guid}/resend-invitations")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult> ResendInvitations(Guid id, [FromBody] SendInvitationRequest request)
        {
            var rfq = await _context.RFQs
                .Include(r => r.RFQVendors)
                .FirstOrDefaultAsync(r => r.Id == id);
            if (rfq == null) return NotFound();

            if (rfq.Status != RFQStatus.Published)
                return BadRequest("RFQ must be published before resending invitations.");

            await SendInvitationsInternalAsync(rfq, request.VendorIds);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id:guid}/vendors/{vendorId:guid}/acknowledge")]
        [Authorize(Roles = "Vendor")]
        public async Task<ActionResult> Acknowledge(Guid id, Guid vendorId, [FromBody] VendorAcknowledgeRequest request)
        {
            var rfqVendor = await _context.RFQVendors.FirstOrDefaultAsync(rv => rv.RFQId == id && rv.VendorId == vendorId);
            if (rfqVendor == null) return NotFound();

            rfqVendor.Status = request.Accepted ? RfqVendorStatus.Acknowledged : RfqVendorStatus.Declined;
            rfqVendor.AcknowledgedAt = DateTime.UtcNow;
            rfqVendor.Notes = request.Notes;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Delete(Guid id)
        {
            var rfq = await _context.RFQs.FindAsync(id);
            if (rfq == null) return NotFound();

            _context.RFQs.Remove(rfq);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string> GenerateReferenceAsync()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
            var reference = $"RFQ-{timestamp}";
            var exists = await _context.RFQs.AnyAsync(r => r.ReferenceNumber == reference);
            if (!exists) return reference;
            return $"RFQ-{timestamp}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
        }

        private async Task SendInvitationsInternalAsync(RFQ rfq, IEnumerable<Guid>? vendorIds)
        {
            var targetVendorIds = vendorIds?.Any() == true
                ? new HashSet<Guid>(vendorIds)
                : rfq.RFQVendors.Select(v => v.VendorId).ToHashSet();

            var vendors = await _context.Vendors
                .Where(v => targetVendorIds.Contains(v.Id))
                .ToListAsync();

            var vendorUsers = await _context.Users
                .Where(u => u.VendorId != null && targetVendorIds.Contains(u.VendorId.Value))
                .GroupBy(u => u.VendorId!.Value)
                .ToDictionaryAsync(g => g.Key, g => g.Select(u => u).ToList());

            foreach (var invitation in rfq.RFQVendors.Where(v => targetVendorIds.Contains(v.VendorId)))
            {
                invitation.Status = RfqVendorStatus.InvitationSent;
                invitation.InvitationSentAt = DateTime.UtcNow;
            }

            foreach (var vendor in vendors)
            {
                var subject = $"RFQ Invitation: {rfq.ReferenceNumber}";
                var body = $"You have been invited to submit a quotation for '{rfq.Title}'. Please log in to review details and acknowledge.";

                if (!string.IsNullOrWhiteSpace(vendor.Email))
                {
                    await _notification.SendEmailAsync(
                        vendor.Email,
                        subject,
                        body);
                }

                if (vendorUsers.TryGetValue(vendor.Id, out var users))
                {
                    foreach (var user in users)
                    {
                        await _notification.SendWebNotificationAsync(user.Id, subject, body);
                    }
                }
            }
        }

        private async Task<RfqDetailDto> LoadDetailAsync(Guid id)
        {
            var rfq = await _context.RFQs
                .AsNoTracking()
                .Include(r => r.Items)
                .Include(r => r.Attachments)
                .Include(r => r.RFQVendors)
                .FirstAsync(r => r.Id == id);

            var vendorInfos = await _context.Vendors
                .Where(v => rfq.RFQVendors.Select(rv => rv.VendorId).Contains(v.Id))
                .Select(v => new { v.Id, v.CompanyName })
                .ToDictionaryAsync(v => v.Id, v => v.CompanyName);

            var prNumber = rfq.PurchaseRequisitionId.HasValue
                ? await _context.PurchaseRequisitions
                    .Where(pr => pr.Id == rfq.PurchaseRequisitionId.Value)
                    .Select(pr => pr.PrNumber)
                    .FirstOrDefaultAsync()
                : null;

            return MapDetail(rfq, vendorInfos, prNumber);
        }

        private static RfqDetailDto MapDetail(RFQ rfq, IDictionary<Guid, string> vendorInfos, string? prNumber)
        {
            return new RfqDetailDto(
                rfq.Id,
                rfq.ReferenceNumber,
                rfq.Title,
                rfq.Terms,
                rfq.Status,
                rfq.DueDate,
                rfq.CreatedAt,
                rfq.PublishedAt,
                rfq.ClosedAt,
                rfq.PurchaseRequisitionId,
                prNumber,
                rfq.Items.Select(i => new RfqItemDto(i.Id, i.Description, i.Specification, i.Quantity, i.Unit)).ToList(),
                rfq.Attachments.Select(a => new RfqAttachmentDto(a.Id, a.FileName, a.StorageUrl, a.UploadedAt, a.UploadedByUserId)).ToList(),
                rfq.RFQVendors.Select(v => new RfqVendorDto(
                    v.Id,
                    v.VendorId,
                    vendorInfos.TryGetValue(v.VendorId, out var name) ? name : "Unknown Vendor",
                    v.Status,
                    v.InvitationSentAt,
                    v.AcknowledgedAt,
                    v.QuoteSubmittedAt,
                    v.Notes)).ToList());
        }
    }
}
