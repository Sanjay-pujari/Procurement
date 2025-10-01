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
    public class RFIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RFIController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RFI>>> GetAll()
        {
            return Ok(await _context.RFIs.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RFI>> Get(Guid id)
        {
            var rfi = await _context.RFIs.FindAsync(id);
            if (rfi == null) return NotFound();
            return Ok(rfi);
        }

        [HttpGet("by-rfq/{rfqId}")]
        public async Task<ActionResult<IEnumerable<RFI>>> GetByRFQ(Guid rfqId)
        {
            var rfis = await _context.RFIs.Where(r => r.RFQId == rfqId).ToListAsync();
            return Ok(rfis);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<RFI>> Create(RFI rfi)
        {
            rfi.Id = Guid.NewGuid();
            _context.RFIs.Add(rfi);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = rfi.Id }, rfi);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> Update(Guid id, RFI rfi)
        {
            if (id != rfi.Id) return BadRequest();

            _context.Entry(rfi).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.RFIs.AnyAsync(e => e.Id == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var rfi = await _context.RFIs.FindAsync(id);
            if (rfi == null) return NotFound();

            _context.RFIs.Remove(rfi);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

