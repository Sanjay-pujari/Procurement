using System.Text.Json.Serialization;

namespace ProcurePro.Api.Modules
{
    public enum TenderVisibility { Open, Closed }

    public class Bid
    {
        public Guid Id { get; set; }
        public Guid RFQId { get; set; }
        public Guid VendorId { get; set; }
        public TenderVisibility Visibility { get; set; } = TenderVisibility.Closed;
        public decimal TotalAmount { get; set; }
        public double Score { get; set; }
        public List<BidItem> Items { get; set; } = new();
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }

    public class BidItem
    {
        public Guid Id { get; set; }
        public Guid BidId { get; set; }
        [JsonIgnore]
        public Bid Bid { get; set; } = default!;
        public string Description { get; set; } = default!;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public enum PaymentStatus { Pending, PartiallyPaid, Paid }
    public class Invoice
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public decimal Amount { get; set; }
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public PurchaseOrder PurchaseOrder { get; set; } = default!;
    }
}
