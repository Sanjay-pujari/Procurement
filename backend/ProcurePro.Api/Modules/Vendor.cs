using System;
using System.Collections.Generic;

namespace ProcurePro.Api.Modules
{
    public enum VendorVerificationStatus
    {
        PendingReview = 0,
        Approved = 1,
        Rejected = 2,
        Suspended = 3,
        Blacklisted = 4
    }

    public class Vendor
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? Phone { get; set; }
        public string? Category { get; set; }
        public string? Address { get; set; }
        public string? TaxId { get; set; }
        public string? Website { get; set; }
        public bool IsActive { get; set; } = true;
        public VendorVerificationStatus VerificationStatus { get; set; } = VendorVerificationStatus.PendingReview;
        public string? VerificationRemarks { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string? VerifiedByUserId { get; set; }
        public double PerformanceRating { get; set; } = 0.0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<VendorDocument> Documents { get; set; } = new();
        public List<VendorStatusHistory> StatusHistory { get; set; } = new();
    }

    public class VendorDocument
    {
        public Guid Id { get; set; }
        public Guid VendorId { get; set; }
        public Vendor Vendor { get; set; } = default!;
        public string DocumentType { get; set; } = default!;
        public string FileName { get; set; } = default!;
        public string StorageUrl { get; set; } = default!;
        public bool IsVerified { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string? UploadedByUserId { get; set; }
        public string? Notes { get; set; }
    }

    public class VendorStatusHistory
    {
        public Guid Id { get; set; }
        public Guid VendorId { get; set; }
        public Vendor Vendor { get; set; } = default!;
        public VendorVerificationStatus Status { get; set; }
        public string? Remarks { get; set; }
        public string? ChangedByUserId { get; set; }
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    }
}
