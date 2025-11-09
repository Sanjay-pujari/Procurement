using System;

namespace ProcurePro.Api.DTO
{
    public record NotificationDto(Guid Id, string Title, string Message, DateTime CreatedAt, bool IsRead, string Channel);
    public record MarkNotificationReadRequest(DateTime? ReadAt = null);
}

