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
    public class RFPController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RFPController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RFP>>> GetAll()
        {
            return Ok(await _context.RFPs.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RFP>> Get(Guid id)
        {
            var rfp = await _context.RFPs.FindAsync(id);
            if (rfp == null) return NotFound();
            return Ok(rfp);
        }

        [HttpGet("by-rfq/{rfqId}")]
        public async Task<ActionResult<IEnumerable<RFP>>> GetByRFQ(Guid rfqId)
        {
            var rfps = await _context.RFPs.Where(r => r.RFQId == rfqId).ToListAsync();
            return Ok(rfps);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<ActionResult<RFP>> Create(RFP rfp)
        {
            rfp.Id = Guid.NewGuid();
            _context.RFPs.Add(rfp);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = rfp.Id }, rfp);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,ProcurementManager")]
        public async Task<IActionResult> Update(Guid id, RFP rfp)
        {
            if (id != rfp.Id) return BadRequest();

            _context.Entry(rfp).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.RFPs.AnyAsync(e => e.Id == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var rfp = await _context.RFPs.FindAsync(id);
            if (rfp == null) return NotFound();

            _context.RFPs.Remove(rfp);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}

