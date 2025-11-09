using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.DTO;
using ProcurePro.Api.Models;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/vendor-portal")]
    public class VendorPortalController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _users;

        public VendorPortalController(ApplicationDbContext context, UserManager<ApplicationUser> users)
        {
            _context = context;
            _users = users;
        }

        [HttpGet("rfqs")]
        [Authorize(Roles = "Vendor")]
        public async Task<ActionResult<IEnumerable<VendorRfqListDto>>> GetAssignedRfqs()
        {
            var vendorId = await GetVendorIdForUserAsync();
            if (vendorId == null) return Forbid();

            var rfqs = await _context.RFQVendors
                .AsNoTracking()
                .Where(rv => rv.VendorId == vendorId.Value)
                .Include(rv => rv.RFQ)
                .OrderByDescending(rv => rv.RFQ.CreatedAt)
                .Select(rv => new VendorRfqListDto(
                    rv.RFQId,
                    rv.RFQ.ReferenceNumber,
                    rv.RFQ.Title,
                    rv.RFQ.DueDate,
                    rv.Status,
                    _context.VendorQuotations.Any(q => q.RFQId == rv.RFQId && q.VendorId == rv.VendorId),
                    rv.InvitationSentAt))
                .ToListAsync();

            return Ok(rfqs);
        }

        [HttpGet("rfqs/{rfqId:guid}")]
        [Authorize(Roles = "Vendor")]
        public async Task<ActionResult<VendorRfqDetailDto>> GetRfqDetail(Guid rfqId)
        {
            var vendorId = await GetVendorIdForUserAsync();
            if (vendorId == null) return Forbid();

            var rfqVendor = await _context.RFQVendors
                .Include(rv => rv.RFQ)
                .FirstOrDefaultAsync(rv => rv.RFQId == rfqId && rv.VendorId == vendorId.Value);

            if (rfqVendor == null) return NotFound();

            var rfq = await _context.RFQs
                .AsNoTracking()
                .Include(r => r.Items)
                .Include(r => r.Attachments)
                .FirstAsync(r => r.Id == rfqId);

            var quotation = await _context.VendorQuotations
                .AsNoTracking()
                .Include(q => q.Items)
                .Include(q => q.Attachments)
                .FirstOrDefaultAsync(q => q.RFQId == rfqId && q.VendorId == vendorId.Value);

            var quotationDto = quotation == null ? null : MapQuotationDto(quotation);

            var dto = new VendorRfqDetailDto(
                rfq.Id,
                rfq.ReferenceNumber,
                rfq.Title,
                rfq.Terms,
                rfq.DueDate,
                rfq.Items.Select(i => new VendorRfqItemDto(i.Id, i.Description, i.Specification, i.Quantity, i.Unit)).ToList(),
                rfq.Attachments.Select(a => new VendorRfqAttachmentDto(a.Id, a.FileName, a.StorageUrl)).ToList(),
                quotationDto);

            return Ok(dto);
        }

        [HttpPost("rfqs/{rfqId:guid}/quote")]
        [Authorize(Roles = "Vendor")]
        public async Task<ActionResult<VendorQuotationDto>> SubmitQuote(Guid rfqId, [FromBody] SubmitVendorQuotationRequest request)
        {
            var vendorId = await GetVendorIdForUserAsync();
            if (vendorId == null) return Forbid();

            var result = await UpsertQuotationAsync(rfqId, vendorId.Value, request);
            return Ok(MapQuotationDto(result));
        }

        [HttpPost("admin/rfqs/{rfqId:guid}/vendor/{vendorId:guid}/quote")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<VendorQuotationDto>> SubmitQuoteAsAdmin(Guid rfqId, Guid vendorId, [FromBody] SubmitVendorQuotationRequest request)
        {
            if (!request.SubmittedByAdmin)
            {
                request = request with { SubmittedByAdmin = true };
            }

            var result = await UpsertQuotationAsync(rfqId, vendorId, request);
            return Ok(MapQuotationDto(result));
        }

        private async Task<VendorQuotation> UpsertQuotationAsync(Guid rfqId, Guid vendorId, SubmitVendorQuotationRequest request)
        {
            var rfqVendor = await _context.RFQVendors
                .Include(rv => rv.RFQ)
                .ThenInclude(r => r.Items)
                .FirstOrDefaultAsync(rv => rv.RFQId == rfqId && rv.VendorId == vendorId);

            if (rfqVendor == null)
                throw new InvalidOperationException("Vendor is not invited to this RFQ.");

            var rfq = rfqVendor.RFQ;
            var rfqItems = rfq.Items.ToDictionary(i => i.Id, i => i);

            if (request.Items == null || !request.Items.Any())
                throw new InvalidOperationException("Quotation requires at least one item.");

            if (request.TaxAmount < 0)
                throw new InvalidOperationException("Tax amount cannot be negative.");

            foreach (var item in request.Items)
            {
                if (!rfqItems.ContainsKey(item.RfqItemId))
                    throw new InvalidOperationException("Invalid RFQ item specified in quotation.");
                if (item.Quantity <= 0)
                    throw new InvalidOperationException("Quoted quantities must be greater than zero.");
                if (item.UnitPrice < 0)
                    throw new InvalidOperationException("Unit price cannot be negative.");
            }

            var quotation = await _context.VendorQuotations
                .Include(q => q.Items)
                .Include(q => q.Attachments)
                .FirstOrDefaultAsync(q => q.RFQId == rfqId && q.VendorId == vendorId);

            if (quotation == null)
            {
                quotation = new VendorQuotation
                {
                    Id = Guid.NewGuid(),
                    RFQId = rfqId,
                    VendorId = vendorId
                };
                _context.VendorQuotations.Add(quotation);
            }

            quotation.Currency = string.IsNullOrWhiteSpace(request.Currency) ? quotation.Currency : request.Currency;
            quotation.ExpectedDeliveryDate = request.ExpectedDeliveryDate;
            quotation.DeliveryTerms = request.DeliveryTerms;
            quotation.Remarks = request.Remarks;
            quotation.SubmittedByAdmin = request.SubmittedByAdmin;
            quotation.AdminNote = request.AdminNote;
            quotation.SubmittedAt = DateTime.UtcNow;

            _context.VendorQuotationItems.RemoveRange(quotation.Items);
            quotation.Items.Clear();

            decimal subtotal = 0m;
            foreach (var item in request.Items)
            {
                var lineTotal = item.UnitPrice * item.Quantity;
                subtotal += lineTotal;

                quotation.Items.Add(new VendorQuotationItem
                {
                    Id = Guid.NewGuid(),
                    VendorQuotationId = quotation.Id,
                    RFQItemId = item.RfqItemId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    LineTotal = lineTotal,
                    Notes = item.Notes
                });
            }

            quotation.Subtotal = subtotal;
            quotation.TaxAmount = request.TaxAmount;
            quotation.TotalAmount = subtotal + request.TaxAmount;

            _context.VendorQuotationAttachments.RemoveRange(quotation.Attachments);
            quotation.Attachments.Clear();

            if (request.Attachments != null)
            {
                var uploaderId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system";
                foreach (var attachment in request.Attachments)
                {
                    quotation.Attachments.Add(new VendorQuotationAttachment
                    {
                        Id = Guid.NewGuid(),
                        VendorQuotationId = quotation.Id,
                        FileName = attachment.FileName,
                        StorageUrl = attachment.StorageUrl,
                        UploadedByUserId = uploaderId,
                        UploadedAt = DateTime.UtcNow
                    });
                }
            }

            rfqVendor.Status = RfqVendorStatus.QuoteSubmitted;
            rfqVendor.QuoteSubmittedAt = DateTime.UtcNow;
            rfqVendor.AcknowledgedAt ??= DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return quotation;
        }

        private static VendorQuotationDto MapQuotationDto(VendorQuotation quotation) =>
            new VendorQuotationDto(
                quotation.Id,
                quotation.Subtotal,
                quotation.TaxAmount,
                quotation.TotalAmount,
                quotation.Currency,
                quotation.ExpectedDeliveryDate,
                quotation.DeliveryTerms,
                quotation.Remarks,
                quotation.SubmittedByAdmin,
                quotation.Items.Select(i => new VendorQuotationItemDto(
                    i.Id,
                    i.RFQItemId,
                    i.Quantity,
                    i.UnitPrice,
                    i.LineTotal,
                    i.Notes)).ToList(),
                quotation.Attachments.Select(a => new VendorQuotationAttachmentDto(
                    a.Id,
                    a.FileName,
                    a.StorageUrl,
                    a.UploadedAt,
                    a.UploadedByUserId)).ToList());

        private async Task<Guid?> GetVendorIdForUserAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId)) return null;

            var user = await _users.FindByIdAsync(userId);
            return user?.VendorId;
        }
    }
}

