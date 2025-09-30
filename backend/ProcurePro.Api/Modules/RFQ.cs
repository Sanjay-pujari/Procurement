namespace ProcurePro.Api.Modules
{
    public enum RFQStatus { Draft, Published, Closed, Awarded }

    public class RFQ
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = default!;
        public string? Terms { get; set; }
        public DateTime DueDate { get; set; }
        public RFQStatus Status { get; set; } = RFQStatus.Draft;
        public List<RFQItem> Items { get; set; } = new();
        public List<RFQVendor> RFQVendors { get; set; } = new();
    }

    public class RFQItem
    {
        public Guid Id { get; set; }
        public Guid RFQId { get; set; }
        public RFQ RFQ { get; set; } = default!;
        public string Description { get; set; } = default!;
        public string? Specification { get; set; }
        public int Quantity { get; set; }
        public string? Unit { get; set; }
    }

    public class RFQVendor
    {
        public Guid Id { get; set; }
        public Guid RFQId { get; set; }
        public Guid VendorId { get; set; }
    }
}
