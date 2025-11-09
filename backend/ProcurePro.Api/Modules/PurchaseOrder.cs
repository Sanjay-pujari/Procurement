using System;

namespace ProcurePro.Api.Modules
{
    public enum PurchaseOrderStatus { Issued = 0, Acknowledged = 1, Completed = 2, Cancelled = 3 }

    public class PurchaseOrder
    {
        public Guid Id { get; set; }
        public Guid VendorQuotationId { get; set; }
        public Guid VendorId { get; set; }
        public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Issued;
        public string? PurchaseOrderNumber { get; set; }
        public string? AmendmentsJson { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? AcknowledgedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public VendorQuotation VendorQuotation { get; set; } = default!;
        public Vendor Vendor { get; set; } = default!;
    }
}

