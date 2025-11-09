using System;
using System.Collections.Generic;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.DTO
{
    public record VendorSummaryDto(
        Guid Id,
        string CompanyName,
        string Email,
        string? Phone,
        string? Category,
        bool IsActive,
        VendorVerificationStatus VerificationStatus,
        DateTime CreatedAt,
        double PerformanceRating);

    public record VendorDocumentDto(
        Guid Id,
        string DocumentType,
        string FileName,
        string StorageUrl,
        bool IsVerified,
        DateTime UploadedAt,
        string? Notes);

    public record VendorStatusHistoryDto(
        Guid Id,
        VendorVerificationStatus Status,
        DateTime ChangedAt,
        string? Remarks,
        string? ChangedByUserId);

    public record VendorPurchaseOrderDto(
        Guid Id,
        string PurchaseOrderNumber,
        string Status,
        DateTime CreatedAt,
        DateTime? CompletedAt);

    public record VendorInvoiceDto(
        Guid Id,
        Guid PurchaseOrderId,
        decimal Amount,
        string PaymentStatus,
        DateTime SubmittedAt);

    public record VendorHistoryDto(
        IReadOnlyCollection<VendorPurchaseOrderDto> PurchaseOrders,
        IReadOnlyCollection<VendorInvoiceDto> Invoices);

    public record VendorDetailDto(
        VendorSummaryDto Vendor,
        VendorHistoryDto History,
        IReadOnlyCollection<VendorDocumentDto> Documents,
        IReadOnlyCollection<VendorStatusHistoryDto> StatusChanges);

    public record VendorDocumentInput(string DocumentType, string FileName, string StorageUrl, string? Notes);

    public record SubmitVendorKycRequest(
        string? Phone,
        string? Address,
        string? TaxId,
        string? Website,
        string? Notes,
        List<VendorDocumentInput> Documents);

    public record ReviewVendorRequest(
        VendorVerificationStatus Status,
        string? Remarks);

    public record UpdateVendorStatusRequest(string? Remarks);
}

