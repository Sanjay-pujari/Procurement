using System;
using System.Collections.Generic;

namespace ProcurePro.Api.Modules
{
    public enum RFQStatus { Draft, Published, Closed, Awarded }

    public enum RfqVendorStatus
    {
        Pending = 0,
        InvitationSent = 1,
        Acknowledged = 2,
        QuoteSubmitted = 3,
        Declined = 4
    }

    public class RFQ
    {
        public Guid Id { get; set; }
        public Guid? PurchaseRequisitionId { get; set; }
        public string ReferenceNumber { get; set; } = default!;
        public string Title { get; set; } = default!;
        public string? Terms { get; set; }
        public DateTime DueDate { get; set; }
        public RFQStatus Status { get; set; } = RFQStatus.Draft;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PublishedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public List<RFQItem> Items { get; set; } = new();
        public List<RFQVendor> RFQVendors { get; set; } = new();
        public List<RFQAttachment> Attachments { get; set; } = new();
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

    public class RFQAttachment
    {
        public Guid Id { get; set; }
        public Guid RFQId { get; set; }
        public RFQ RFQ { get; set; } = default!;
        public string FileName { get; set; } = default!;
        public string StorageUrl { get; set; } = default!;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string UploadedByUserId { get; set; } = default!;
    }

    public class RFQVendor
    {
        public Guid Id { get; set; }
        public Guid RFQId { get; set; }
        public RFQ RFQ { get; set; } = default!;
        public Guid VendorId { get; set; }
        public RfqVendorStatus Status { get; set; } = RfqVendorStatus.Pending;
        public DateTime? InvitationSentAt { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public DateTime? LastReminderSentAt { get; set; }
        public DateTime? QuoteSubmittedAt { get; set; }
        public string? Notes { get; set; }
    }
}
