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
    public class RFQController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RFQController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RFQ>>> GetAll()
        {
            var rfqs = await _context.RFQs
                .Include(r => r.Items)
                .Include(r => r.RFQVendors)
                .OrderByDescending(r => r.DueDate)
                .ToListAsync();
            return Ok(rfqs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RFQ>> Get(Guid id)
        {
            var rfq = await _context.RFQs
                .Include(r => r.Items)
                .Include(r => r.RFQVendors)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rfq == null) return NotFound();
            return Ok(rfq);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<RFQ>> Create(RFQ rfq)
        {
            rfq.Id = Guid.NewGuid();
            foreach (var item in rfq.Items)
            {
                item.Id = Guid.NewGuid();
                item.RFQId = rfq.Id;
            }
            foreach (var vendor in rfq.RFQVendors)
            {
                vendor.Id = Guid.NewGuid();
                vendor.RFQId = rfq.Id;
            }

            _context.RFQs.Add(rfq);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = rfq.Id }, rfq);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> Update(Guid id, RFQ rfq)
        {
            if (id != rfq.Id) return BadRequest();

            var existing = await _context.RFQs
                .Include(r => r.Items)
                .Include(r => r.RFQVendors)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (existing == null) return NotFound();

            existing.Title = rfq.Title;
            existing.Terms = rfq.Terms;
            existing.DueDate = rfq.DueDate;
            existing.Status = rfq.Status;

            // Update items
            _context.RFQItems.RemoveRange(existing.Items);
            foreach (var item in rfq.Items)
            {
                item.Id = Guid.NewGuid();
                item.RFQId = id;
                existing.Items.Add(item);
            }

            // Update vendors
            _context.RFQVendors.RemoveRange(existing.RFQVendors);
            foreach (var vendor in rfq.RFQVendors)
            {
                vendor.Id = Guid.NewGuid();
                vendor.RFQId = id;
                existing.RFQVendors.Add(vendor);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var rfq = await _context.RFQs.FindAsync(id);
            if (rfq == null) return NotFound();

            _context.RFQs.Remove(rfq);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/publish")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> Publish(Guid id)
        {
            var rfq = await _context.RFQs.FindAsync(id);
            if (rfq == null) return NotFound();

            rfq.Status = RFQStatus.Published;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/close")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> Close(Guid id)
        {
            var rfq = await _context.RFQs.FindAsync(id);
            if (rfq == null) return NotFound();

            rfq.Status = RFQStatus.Closed;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

