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
    [Authorize(Policy = "RequireProcurementManager")]
    public class VendorsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly INotificationService _notify;

        public VendorsController(ApplicationDbContext db, INotificationService notify)
        {
            _db = db; _notify = notify;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vendor>>> GetAll() =>
            Ok(await _db.Vendors.AsNoTracking().OrderByDescending(v => v.CreatedAt).ToListAsync());

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<Vendor>> Get(Guid id)
        {
            var v = await _db.Vendors.FindAsync(id);
            return v == null ? NotFound() : Ok(v);
        }

        [HttpPost]
        public async Task<ActionResult<Vendor>> Create([FromBody] Vendor vendor)
        {
            vendor.Id = Guid.NewGuid();
            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = vendor.Id }, vendor);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Vendor vendor)
        {
            if (id != vendor.Id) return BadRequest();
            _db.Entry(vendor).State = EntityState.Modified;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var v = await _db.Vendors.FindAsync(id);
            if (v == null) return NotFound();
            _db.Vendors.Remove(v);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id:guid}/deactivate")]
        public async Task<IActionResult> Deactivate(Guid id)
        {
            var v = await _db.Vendors.FindAsync(id);
            if (v == null) return NotFound();
            v.IsActive = false;
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
