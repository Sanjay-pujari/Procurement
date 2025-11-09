using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.Modules;
using ProcurePro.Api.Services;
using System.Security.Claims;

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
        [Authorize(Roles = "Admin,ProcurementManager,Approver,Vendor")]
        public async Task<ActionResult<IEnumerable<Bid>>> GetAll()
        {
            var query = _context.Bids
                .Include(b => b.Items)
                .OrderByDescending(b => b.SubmittedAt)
                .AsQueryable();

            if (User.IsInRole("Vendor"))
            	{
            	    var vendorId = await GetCurrentVendorIdAsync();
            	    if (vendorId == null)
            	        return Forbid();
            	
            	    query = query.Where(b => b.VendorId == vendorId.Value);
            	}

            var bids = await query.ToListAsync();
            return Ok(bids);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Bid>> Get(Guid id)
        {
            var bid = await _context.Bids
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bid == null) return NotFound();

            if (User.IsInRole("Vendor"))
            {
                var vendorId = await GetCurrentVendorIdAsync();
                if (vendorId == null || bid.VendorId != vendorId.Value)
                    return NotFound();
            }

            return Ok(bid);
        }

        [HttpGet("by-rfq/{rfqId}")]
        [Authorize(Roles = "Admin,ProcurementManager,Approver,Vendor")]
        public async Task<ActionResult<IEnumerable<Bid>>> GetByRFQ(Guid rfqId)
        {
            var query = _context.Bids
                .Include(b => b.Items)
                .Where(b => b.RFQId == rfqId)
                .OrderByDescending(b => b.Score)
                .AsQueryable();

            if (User.IsInRole("Vendor"))
            {
                var vendorId = await GetCurrentVendorIdAsync();
                if (vendorId == null)
                    return Forbid();

                query = query.Where(b => b.VendorId == vendorId.Value);
            }

            var bids = await query.ToListAsync();
            return Ok(bids);
        }

        [HttpPost]
        [Authorize(Roles = "Vendor")]
        public async Task<ActionResult<Bid>> Create(Bid bid)
        {
            var vendorId = await GetCurrentVendorIdAsync();
            if (vendorId == null)
                return Forbid();

            bid.Id = Guid.NewGuid();
            bid.VendorId = vendorId.Value;
            bid.SubmittedAt = DateTime.UtcNow;

            foreach (var item in bid.Items)
            {
                item.Id = Guid.NewGuid();
                item.BidId = bid.Id;
            }

            bid.TotalAmount = bid.Items.Sum(i => i.Quantity * i.UnitPrice);
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

            var vendorId = await GetCurrentVendorIdAsync();
            if (vendorId == null || existing.VendorId != vendorId.Value)
                return NotFound();

            existing.Visibility = bid.Visibility;
            existing.TotalAmount = bid.Items.Sum(i => i.Quantity * i.UnitPrice);

            _context.BidItems.RemoveRange(existing.Items);
            existing.Items.Clear();

            foreach (var item in bid.Items)
            {
                item.Id = Guid.NewGuid();
                item.BidId = id;
                existing.Items.Add(item);
            }

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

            if (User.IsInRole("Vendor"))
            {
                var vendorId = await GetCurrentVendorIdAsync();
                if (vendorId == null || bid.VendorId != vendorId.Value)
                    return NotFound();
            }

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

        private async Task<Guid?> GetCurrentVendorIdAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return null;

            return await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => u.VendorId)
                .FirstOrDefaultAsync();
        }
    }
}

