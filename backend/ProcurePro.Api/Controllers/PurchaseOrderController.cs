using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.DTO;
using ProcurePro.Api.Modules;
using ProcurePro.Api.Services;
using Microsoft.AspNetCore.Identity;
using ProcurePro.Api.Models;
using System.Linq;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PurchaseOrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notifications;
        private readonly UserManager<ApplicationUser> _users;

        public PurchaseOrderController(ApplicationDbContext context, INotificationService notifications, UserManager<ApplicationUser> users)
        {
            _context = context;
            _notifications = notifications;
            _users = users;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrderSummaryDto>>> GetAll()
        {
            var purchaseOrders = await _context.PurchaseOrders
                .AsNoTracking()
                .Include(po => po.VendorQuotation)
                .OrderByDescending(po => po.CreatedAt)
                .Select(po => new PurchaseOrderSummaryDto(
                    po.Id,
                    po.PurchaseOrderNumber!,
                    po.VendorId,
                    po.VendorQuotationId,
                    po.Status,
                    po.CreatedAt,
                    po.AcknowledgedAt,
                    po.CompletedAt))
                .ToListAsync();

            return Ok(purchaseOrders);
        }

        [HttpGet("ready-to-issue")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<IEnumerable<PurchaseOrderIssueOptionDto>>> GetReadyToIssue()
        {
            var options = await _context.VendorQuotations
                .AsNoTracking()
                .Include(q => q.Vendor)
                .Include(q => q.RFQ)
                .Where(q => !_context.PurchaseOrders.Any(po => po.VendorQuotationId == q.Id))
                .OrderByDescending(q => q.SubmittedAt)
                .Select(q => new PurchaseOrderIssueOptionDto(
                    q.Id,
                    string.IsNullOrWhiteSpace(q.Vendor.CompanyName) ? q.Vendor.Email : q.Vendor.CompanyName!,
                    string.IsNullOrWhiteSpace(q.RFQ.ReferenceNumber) ? q.RFQ.Title : q.RFQ.ReferenceNumber!,
                    q.TotalAmount,
                    q.Currency,
                    q.SubmittedAt))
                .ToListAsync();

            return Ok(options);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<PurchaseOrderDetailDto>> Get(Guid id)
        {
            var po = await _context.PurchaseOrders
                .AsNoTracking()
                .Include(p => p.VendorQuotation)
                    .ThenInclude(q => q.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (po == null) return NotFound();

            return Ok(MapDetail(po));
        }

        [HttpPost("issue")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<PurchaseOrderDetailDto>> Issue([FromBody] IssuePurchaseOrderRequest request)
        {
            var quotation = await _context.VendorQuotations
                .Include(q => q.Items)
                .Include(q => q.Vendor)
                .Include(q => q.RFQ)
                .FirstOrDefaultAsync(q => q.Id == request.VendorQuotationId);

            if (quotation == null)
                return NotFound("Quotation not found.");

            var existingPo = await _context.PurchaseOrders
                .FirstOrDefaultAsync(po => po.VendorQuotationId == quotation.Id);

            if (existingPo != null)
                return Conflict("Purchase order already issued for this quotation.");

            var po = new PurchaseOrder
            {
                Id = Guid.NewGuid(),
                VendorQuotationId = quotation.Id,
                VendorId = quotation.VendorId,
                PurchaseOrderNumber = await GeneratePoNumberAsync(),
                CreatedAt = DateTime.UtcNow,
                AmendmentsJson = request.AmendmentsJson,
                Status = PurchaseOrderStatus.Issued
            };

            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync();

            await NotifyVendorOfNewPoAsync(po, quotation);

            return CreatedAtAction(nameof(Get), new { id = po.Id }, MapDetail(po, quotation));
        }

        [HttpPost("{id:guid}/acknowledge")]
        [Authorize(Roles = "Vendor")]
        public async Task<IActionResult> Acknowledge(Guid id)
        {
            var po = await _context.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == id);
            if (po == null) return NotFound();

            po.Status = PurchaseOrderStatus.Acknowledged;
            po.AcknowledgedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await NotifyProcurementManagersAsync("Purchase order acknowledged", $"PO {po.PurchaseOrderNumber} has been acknowledged by the vendor.");

            return NoContent();
        }

        [HttpPost("{id:guid}/complete")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> Complete(Guid id)
        {
            var po = await _context.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == id);
            if (po == null) return NotFound();

            po.Status = PurchaseOrderStatus.Completed;
            po.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await NotifyVendorStatusChangeAsync(po, "Purchase order completed", $"PO {po.PurchaseOrderNumber} has been marked as completed.");

            return NoContent();
        }

        private async Task<string> GeneratePoNumberAsync()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
            var poNumber = $"PO-{timestamp}";
            var exists = await _context.PurchaseOrders.AnyAsync(po => po.PurchaseOrderNumber == poNumber);
            if (!exists) return poNumber;

            return $"PO-{timestamp}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
        }

        private PurchaseOrderDetailDto MapDetail(PurchaseOrder po, VendorQuotation? quotation = null)
        {
            quotation ??= _context.VendorQuotations
                .AsNoTracking()
                .Include(q => q.Items)
                .First(q => q.Id == po.VendorQuotationId);

            return new PurchaseOrderDetailDto(
                po.Id,
                po.PurchaseOrderNumber!,
                po.VendorId,
                po.VendorQuotationId,
                po.Status,
                po.CreatedAt,
                po.AcknowledgedAt,
                po.CompletedAt,
                quotation.Currency,
                quotation.TotalAmount,
                quotation.Items.Select(i => new PurchaseOrderItemDto(
                    i.RFQItemId,
                    i.Quantity,
                    i.UnitPrice,
                    i.LineTotal,
                    i.Notes)).ToList(),
                po.AmendmentsJson);
        }

        private async Task NotifyVendorOfNewPoAsync(PurchaseOrder po, VendorQuotation quotation)
        {
            var subject = $"Purchase order {po.PurchaseOrderNumber} issued";
            var rfqRef = quotation.RFQ?.ReferenceNumber ?? quotation.RFQ?.Title ?? "RFQ";
            var message = $"A new purchase order ({po.PurchaseOrderNumber}) has been issued for {rfqRef}. Total value: {quotation.TotalAmount:C}. Please acknowledge at your earliest convenience.";

            if (quotation.Vendor != null && !string.IsNullOrWhiteSpace(quotation.Vendor.Email))
            {
                await _notifications.SendEmailAsync(quotation.Vendor.Email, subject, message);
            }

            var vendorUsers = await _users.Users.Where(u => u.VendorId == po.VendorId).ToListAsync();
            foreach (var user in vendorUsers)
            {
                await _notifications.SendWebNotificationAsync(user.Id, subject, message);
            }
        }

        private async Task NotifyVendorStatusChangeAsync(PurchaseOrder po, string subject, string message)
        {
            var vendor = await _context.Vendors.AsNoTracking().FirstOrDefaultAsync(v => v.Id == po.VendorId);
            if (vendor != null && !string.IsNullOrWhiteSpace(vendor.Email))
            {
                await _notifications.SendEmailAsync(vendor.Email, subject, message);
            }

            var vendorUsers = await _users.Users.Where(u => u.VendorId == po.VendorId).ToListAsync();
            foreach (var user in vendorUsers)
            {
                await _notifications.SendWebNotificationAsync(user.Id, subject, message);
            }
        }

        private async Task NotifyProcurementManagersAsync(string title, string message)
        {
            var managers = await _users.GetUsersInRoleAsync("ProcurementManager");
            foreach (var manager in managers)
            {
                if (!string.IsNullOrWhiteSpace(manager.Email))
                {
                    await _notifications.SendEmailAsync(manager.Email, title, message);
                }
                await _notifications.SendWebNotificationAsync(manager.Id, title, message);
            }
        }
    }
}
