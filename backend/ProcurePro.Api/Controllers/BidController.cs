using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.Modules;
using ProcurePro.Api.Services;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BidController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IBidScoringService _scoringService;

        public BidController(ApplicationDbContext context, IBidScoringService scoringService)
        {
            _context = context;
            _scoringService = scoringService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,ProcurementManager,Approver")]
        public async Task<ActionResult<IEnumerable<Bid>>> GetAll()
        {
            var bids = await _context.Bids
                .Include(b => b.Items)
                .OrderByDescending(b => b.SubmittedAt)
                .ToListAsync();
            return Ok(bids);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Bid>> Get(Guid id)
        {
            var bid = await _context.Bids
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bid == null) return NotFound();
            return Ok(bid);
        }

        [HttpGet("by-rfq/{rfqId}")]
        [Authorize(Roles = "Admin,ProcurementManager,Approver")]
        public async Task<ActionResult<IEnumerable<Bid>>> GetByRFQ(Guid rfqId)
        {
            var bids = await _context.Bids
                .Include(b => b.Items)
                .Where(b => b.RFQId == rfqId)
                .OrderByDescending(b => b.Score)
                .ToListAsync();
            return Ok(bids);
        }

        [HttpPost]
        [Authorize(Roles = "Vendor")]
        public async Task<ActionResult<Bid>> Create(Bid bid)
        {
            bid.Id = Guid.NewGuid();
            bid.SubmittedAt = DateTime.UtcNow;

            foreach (var item in bid.Items)
            {
                item.Id = Guid.NewGuid();
                item.BidId = bid.Id;
            }

            // Calculate total amount
            bid.TotalAmount = bid.Items.Sum(i => i.Quantity * i.UnitPrice);

            // Calculate score
            bid.Score = _scoringService.ComputeScore(bid);

            _context.Bids.Add(bid);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = bid.Id }, bid);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Vendor")]
        public async Task<IActionResult> Update(Guid id, Bid bid)
        {
            if (id != bid.Id) return BadRequest();

            var existing = await _context.Bids
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (existing == null) return NotFound();

            existing.Visibility = bid.Visibility;
            existing.TotalAmount = bid.Items.Sum(i => i.Quantity * i.UnitPrice);

            // Update items
            _context.BidItems.RemoveRange(existing.Items);
            foreach (var item in bid.Items)
            {
                item.Id = Guid.NewGuid();
                item.BidId = id;
                existing.Items.Add(item);
            }

            // Recalculate score
            existing.Score = _scoringService.ComputeScore(existing);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Vendor")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var bid = await _context.Bids.FindAsync(id);
            if (bid == null) return NotFound();

            _context.Bids.Remove(bid);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/evaluate")]
        [Authorize(Roles = "Admin,ProcurementManager,Approver")]
        public async Task<ActionResult<double>> Evaluate(Guid id)
        {
            var bid = await _context.Bids
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bid == null) return NotFound();

            bid.Score = _scoringService.ComputeScore(bid);
            await _context.SaveChangesAsync();
            return Ok(bid.Score);
        }
    }
}

