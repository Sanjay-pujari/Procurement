using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.DTO;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,ProcurementManager")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ReportsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet("overview")]
        public async Task<ActionResult<ReportsOverviewDto>> GetOverview()
        {
            var prStatusRaw = await _db.PurchaseRequisitions
                .GroupBy(pr => pr.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var rfqStatusRaw = await _db.RFQs
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var poStatusRaw = await _db.PurchaseOrders
                .GroupBy(po => po.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var invoiceStatusRaw = await _db.Invoices
                .GroupBy(inv => inv.PaymentStatus)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var vendorStatusRaw = await _db.Vendors
                .GroupBy(v => v.VerificationStatus)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var startOfYear = new DateTime(DateTime.UtcNow.Year, 1, 1);
            var totalSpendYtdRaw = await _db.PurchaseOrders
                .Where(po => po.CreatedAt >= startOfYear && po.Status != PurchaseOrderStatus.Cancelled)
                .Join(_db.VendorQuotations,
                    po => po.VendorQuotationId,
                    vq => vq.Id,
                    (po, vq) => new { vq.TotalAmount })
                .Select(x => (decimal?)x.TotalAmount)
                .SumAsync() ?? 0m;

            var outstandingInvoiceAmount = await _db.Invoices
                .Where(inv => inv.PaymentStatus != PaymentStatus.Paid)
                .Select(inv => (decimal?)inv.Amount)
                .SumAsync() ?? 0m;

            var monthStart = new DateTime(DateTime.UtcNow.AddMonths(-11).Year, DateTime.UtcNow.AddMonths(-11).Month, 1);
            var monthlyPoRaw = await _db.PurchaseOrders
                .Where(po => po.CreatedAt >= monthStart && po.Status != PurchaseOrderStatus.Cancelled)
                .Join(_db.VendorQuotations,
                    po => po.VendorQuotationId,
                    vq => vq.Id,
                    (po, vq) => new { po.CreatedAt, vq.TotalAmount })
                .GroupBy(x => new { x.CreatedAt.Year, x.CreatedAt.Month })
                .Select(g => new
                {
                    g.Key.Year,
                    g.Key.Month,
                    TotalAmount = g.Sum(x => x.TotalAmount)
                })
                .OrderBy(x => x.Year).ThenBy(x => x.Month)
                .ToListAsync();

            var overview = new ReportsOverviewDto(
                prStatusRaw.Select(x => new StatusBreakdownDto(x.Status.ToString(), x.Count)).ToList(),
                rfqStatusRaw.Select(x => new StatusBreakdownDto(x.Status.ToString(), x.Count)).ToList(),
                poStatusRaw.Select(x => new StatusBreakdownDto(x.Status.ToString(), x.Count)).ToList(),
                invoiceStatusRaw.Select(x => new StatusBreakdownDto(x.Status.ToString(), x.Count)).ToList(),
                vendorStatusRaw.Select(x => new StatusBreakdownDto(x.Status.ToString(), x.Count)).ToList(),
                totalSpendYtdRaw,
                outstandingInvoiceAmount,
                monthlyPoRaw.Select(x => new MonthlySpendDto(x.Year, x.Month, x.TotalAmount)).ToList()
            );

            return Ok(overview);
        }
    }
}

