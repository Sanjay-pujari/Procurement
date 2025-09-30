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
        public Task SendEmailAsync(string to, string subject, string body) => Task.CompletedTask;
        public Task SendWhatsAppAsync(string toPhone, string message) => Task.CompletedTask;
        public Task SendWebNotificationAsync(string userId, string title, string message) => Task.CompletedTask;
    }
}
