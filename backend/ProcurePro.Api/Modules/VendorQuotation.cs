using System;
using System.Collections.Generic;

namespace ProcurePro.Api.Modules
{
    public class VendorQuotation
    {
        public Guid Id { get; set; }
        public Guid RFQId { get; set; }
        public RFQ RFQ { get; set; } = default!;
        public Guid VendorId { get; set; }
        public Vendor Vendor { get; set; } = default!;
        public decimal Subtotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = "USD";
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string? DeliveryTerms { get; set; }
        public string? Remarks { get; set; }
        public bool SubmittedByAdmin { get; set; }
        public string? AdminNote { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public List<VendorQuotationItem> Items { get; set; } = new();
        public List<VendorQuotationAttachment> Attachments { get; set; } = new();
        public PurchaseOrder? PurchaseOrder { get; set; }
    }

    public class VendorQuotationItem
    {
        public Guid Id { get; set; }
        public Guid VendorQuotationId { get; set; }
        public VendorQuotation VendorQuotation { get; set; } = default!;
        public Guid RFQItemId { get; set; }
        public RFQItem RFQItem { get; set; } = default!;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
        public string? Notes { get; set; }
    }

    public class VendorQuotationAttachment
    {
        public Guid Id { get; set; }
        public Guid VendorQuotationId { get; set; }
        public VendorQuotation VendorQuotation { get; set; } = default!;
        public string FileName { get; set; } = default!;
        public string StorageUrl { get; set; } = default!;
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string UploadedByUserId { get; set; } = default!;
    }
}

