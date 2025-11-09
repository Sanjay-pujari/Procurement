using System;
using Microsoft.Extensions.Logging;
using ProcurePro.Api.Data;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.Services
{
    public interface INotificationService
    {
        Task SendEmailAsync(string to, string subject, string body);
        Task SendWhatsAppAsync(string toPhone, string message);
        Task SendWebNotificationAsync(string userId, string title, string message);
    }

    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ApplicationDbContext db, ILogger<NotificationService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            _logger.LogInformation("Sending email notification to {Recipient} with subject {Subject}", to, subject);
            await PersistAsync(new Notification
            {
                Id = Guid.NewGuid(),
                Channel = "Email",
                Recipient = to,
                Title = subject,
                Message = body,
                CreatedAt = DateTime.UtcNow,
                DeliveredAt = DateTime.UtcNow
            });
            // Integrate actual email transport here when available.
        }

        public async Task SendWhatsAppAsync(string toPhone, string message)
        {
            _logger.LogInformation("Sending WhatsApp notification to {Recipient}", toPhone);
            await PersistAsync(new Notification
            {
                Id = Guid.NewGuid(),
                Channel = "WhatsApp",
                Recipient = toPhone,
                Title = "WhatsApp Notification",
                Message = message,
                CreatedAt = DateTime.UtcNow,
                DeliveredAt = DateTime.UtcNow
            });
            // Integrate actual WhatsApp provider here when available.
        }

        public async Task SendWebNotificationAsync(string userId, string title, string message)
        {
            _logger.LogInformation("Sending web notification to user {UserId} with title {Title}", userId, title);
            await PersistAsync(new Notification
            {
                Id = Guid.NewGuid(),
                Channel = "Web",
                UserId = userId,
                Recipient = userId,
                Title = title,
                Message = message,
                CreatedAt = DateTime.UtcNow
            });
        }

        private async Task PersistAsync(Notification notification)
        {
            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();
        }
    }
}
