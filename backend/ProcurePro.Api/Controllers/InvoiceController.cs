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
    public class InvoiceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvoiceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetAll()
        {
            var invoices = await _context.Invoices
                .OrderByDescending(i => i.SubmittedAt)
                .ToListAsync();
            return Ok(invoices);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> Get(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpGet("by-po/{poId}")]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetByPO(Guid poId)
        {
            var invoices = await _context.Invoices
                .Where(i => i.PurchaseOrderId == poId)
                .OrderByDescending(i => i.SubmittedAt)
                .ToListAsync();
            return Ok(invoices);
        }

        [HttpPost]
        [Authorize(Roles = "Vendor")]
        public async Task<ActionResult<Invoice>> Create(Invoice invoice)
        {
            invoice.Id = Guid.NewGuid();
            invoice.SubmittedAt = DateTime.UtcNow;
            invoice.PaymentStatus = PaymentStatus.Pending;

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = invoice.Id }, invoice);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,ProcurementManager,Vendor")]
        public async Task<IActionResult> Update(Guid id, Invoice invoice)
        {
            if (id != invoice.Id) return BadRequest();

            _context.Entry(invoice).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Invoices.AnyAsync(e => e.Id == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/mark-paid")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> MarkPaid(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            invoice.PaymentStatus = PaymentStatus.Paid;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/mark-partially-paid")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> MarkPartiallyPaid(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();

            invoice.PaymentStatus = PaymentStatus.PartiallyPaid;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

