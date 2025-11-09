using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public DashboardController(ApplicationDbContext db) { _db = db; }

        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            var bids = await _db.Bids.CountAsync();
            var rfqs = await _db.RFQs.CountAsync();
            var rfps = await _db.RFPs.CountAsync();
            var rfis = await _db.RFIs.CountAsync();
            var pos = await _db.PurchaseOrders.CountAsync();
            var invoices = await _db.Invoices.CountAsync();

            var rfqStatus = await _db.RFQs.GroupBy(r => r.Status)
                .Select(g => new { status = g.Key.ToString(), count = g.Count() }).ToListAsync();

            var pendingVendorApprovals = await _db.Vendors.CountAsync(v => v.VerificationStatus == VendorVerificationStatus.PendingReview);
            var suspendedVendors = await _db.Vendors.CountAsync(v => v.VerificationStatus == VendorVerificationStatus.Suspended);
            var blacklistedVendors = await _db.Vendors.CountAsync(v => v.VerificationStatus == VendorVerificationStatus.Blacklisted);

            var pendingRequisitions = await _db.PurchaseRequisitions.CountAsync(pr => pr.Status == PurchaseRequisitionStatus.PendingApproval);
            var pendingPurchaseOrders = await _db.PurchaseOrders.CountAsync(po => po.Status == PurchaseOrderStatus.Issued);
            var outstandingInvoices = await _db.Invoices.CountAsync(inv => inv.PaymentStatus != PaymentStatus.Paid);

            return Ok(new
            {
                bids,
                rfqs,
                rfps,
                rfis,
                pos,
                invoices,
                rfqStatus,
                alerts = new
                {
                    pendingVendorApprovals,
                    suspendedVendors,
                    blacklistedVendors,
                    pendingRequisitions,
                    pendingPurchaseOrders,
                    outstandingInvoices
                }
            });
        }
    }
}
