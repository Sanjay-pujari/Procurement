using System;
using System.Collections.Generic;

namespace ProcurePro.Api.Modules
{
    public enum PurchaseRequisitionStatus
    {
        Draft = 0,
        PendingApproval = 1,
        Approved = 2,
        Rejected = 3
    }

    public enum PurchaseRequisitionUrgency
    {
        Low = 0,
        Medium = 1,
        High = 2,
        Critical = 3
    }

    public enum PurchaseRequisitionApprovalStatus
    {
        NotStarted = 0,
        Pending = 1,
        Approved = 2,
        Rejected = 3,
        Skipped = 4
    }

    public class PurchaseRequisition
    {
        public Guid Id { get; set; }
        public string PrNumber { get; set; } = default!;
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public string CostCenter { get; set; } = default!;
        public PurchaseRequisitionUrgency Urgency { get; set; } = PurchaseRequisitionUrgency.Medium;
        public DateTime NeededBy { get; set; }
        public PurchaseRequisitionStatus Status { get; set; } = PurchaseRequisitionStatus.Draft;
        public string RequestedByUserId { get; set; } = default!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? Department { get; set; }

        public List<PurchaseRequisitionItem> Items { get; set; } = new();
        public List<PurchaseRequisitionAttachment> Attachments { get; set; } = new();
        public List<PurchaseRequisitionApproval> Approvals { get; set; } = new();
    }

    public class PurchaseRequisitionItem
    {
        public Guid Id { get; set; }
        public Guid PurchaseRequisitionId { get; set; }
        public PurchaseRequisition PurchaseRequisition { get; set; } = default!;
        public string ItemName { get; set; } = default!;
        public string? Specification { get; set; }
        public int Quantity { get; set; }
        public string? UnitOfMeasure { get; set; }
        public decimal EstimatedUnitCost { get; set; }
    }

    public class PurchaseRequisitionAttachment
    {
        public Guid Id { get; set; }
        public Guid PurchaseRequisitionId { get; set; }
        public PurchaseRequisition PurchaseRequisition { get; set; } = default!;
        public string FileName { get; set; } = default!;
        public string StorageUrl { get; set; } = default!;
        public string UploadedByUserId { get; set; } = default!;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }

    public class PurchaseRequisitionApproval
    {
        public Guid Id { get; set; }
        public Guid PurchaseRequisitionId { get; set; }
        public PurchaseRequisition PurchaseRequisition { get; set; } = default!;
        public int Sequence { get; set; }
        public string ApproverUserId { get; set; } = default!;
        public PurchaseRequisitionApprovalStatus Status { get; set; } = PurchaseRequisitionApprovalStatus.NotStarted;
        public DateTime? ActionedAt { get; set; }
        public string? Comments { get; set; }
    }
}

