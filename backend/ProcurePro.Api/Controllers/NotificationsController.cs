using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcurePro.Api.Data;
using ProcurePro.Api.DTO;
using System.Security.Claims;

namespace ProcurePro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public NotificationsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> Get([FromQuery] string channel = "Web")
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var items = await _db.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == userId && n.Channel == channel)
                .OrderByDescending(n => n.CreatedAt)
                .Take(100)
                .Select(n => new NotificationDto(n.Id, n.Title, n.Message, n.CreatedAt, n.ReadAt != null, n.Channel))
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount([FromQuery] string channel = "Web")
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var count = await _db.Notifications
                .Where(n => n.UserId == userId && n.Channel == channel && n.ReadAt == null)
                .CountAsync();

            return Ok(count);
        }

        [HttpPost("{id:guid}/read")]
        public async Task<IActionResult> MarkRead(Guid id, [FromBody] MarkNotificationReadRequest? request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (notification == null) return NotFound();

            if (notification.ReadAt == null)
            {
                notification.ReadAt = request?.ReadAt ?? DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllRead([FromBody] MarkNotificationReadRequest? request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var now = request?.ReadAt ?? DateTime.UtcNow;
            var pending = await _db.Notifications
                .Where(n => n.UserId == userId && n.Channel == "Web" && n.ReadAt == null)
                .ToListAsync();

            if (!pending.Any())
                return NoContent();

            foreach (var notification in pending)
            {
                notification.ReadAt = now;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}

