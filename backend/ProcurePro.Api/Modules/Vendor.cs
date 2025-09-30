namespace ProcurePro.Api.Modules
{
    public class Vendor
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? Phone { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; } = true;
        public double PerformanceRating { get; set; } = 0.0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
