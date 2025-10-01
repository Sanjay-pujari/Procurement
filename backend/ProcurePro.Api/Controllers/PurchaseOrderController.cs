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
    public class PurchaseOrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PurchaseOrderController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrder>>> GetAll()
        {
            var pos = await _context.PurchaseOrders
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            return Ok(pos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrder>> Get(Guid id)
        {
            var po = await _context.PurchaseOrders.FindAsync(id);
            if (po == null) return NotFound();
            return Ok(po);
        }

        [HttpGet("by-bid/{bidId}")]
        public async Task<ActionResult<PurchaseOrder>> GetByBid(Guid bidId)
        {
            var po = await _context.PurchaseOrders.FirstOrDefaultAsync(p => p.BidId == bidId);
            if (po == null) return NotFound();
            return Ok(po);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<PurchaseOrder>> Create(PurchaseOrder purchaseOrder)
        {
            purchaseOrder.Id = Guid.NewGuid();
            purchaseOrder.CreatedAt = DateTime.UtcNow;
            purchaseOrder.Status = POStatus.Issued;

            _context.PurchaseOrders.Add(purchaseOrder);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = purchaseOrder.Id }, purchaseOrder);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> Update(Guid id, PurchaseOrder purchaseOrder)
        {
            if (id != purchaseOrder.Id) return BadRequest();

            _context.Entry(purchaseOrder).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.PurchaseOrders.AnyAsync(e => e.Id == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var po = await _context.PurchaseOrders.FindAsync(id);
            if (po == null) return NotFound();

            _context.PurchaseOrders.Remove(po);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/acknowledge")]
        [Authorize(Roles = "Vendor")]
        public async Task<IActionResult> Acknowledge(Guid id)
        {
            var po = await _context.PurchaseOrders.FindAsync(id);
            if (po == null) return NotFound();

            po.Status = POStatus.Acknowledged;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/complete")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> Complete(Guid id)
        {
            var po = await _context.PurchaseOrders.FindAsync(id);
            if (po == null) return NotFound();

            po.Status = POStatus.Completed;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

