using System;

namespace ProcurePro.Api.Modules
{
    public class Notification
    {
        public Guid Id { get; set; }
        public string? UserId { get; set; }
        public string Channel { get; set; } = "Web";
        public string? Recipient { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ReadAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
    }
}

