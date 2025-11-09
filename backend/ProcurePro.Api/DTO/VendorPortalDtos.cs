using System;
using System.Collections.Generic;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.DTO
{
    public record VendorRfqListDto(
        Guid RfqId,
        string ReferenceNumber,
        string Title,
        DateTime DueDate,
        RfqVendorStatus Status,
        bool QuoteSubmitted,
        DateTime? InvitationSentAt);

    public record VendorRfqDetailDto(
        Guid RfqId,
        string ReferenceNumber,
        string Title,
        string? Terms,
        DateTime DueDate,
        IReadOnlyCollection<VendorRfqItemDto> Items,
        IReadOnlyCollection<VendorRfqAttachmentDto> Attachments,
        VendorQuotationDto? ExistingQuotation);

    public record VendorRfqItemDto(
        Guid ItemId,
        string Description,
        string? Specification,
        int Quantity,
        string? Unit);

    public record VendorRfqAttachmentDto(
        Guid AttachmentId,
        string FileName,
        string StorageUrl);

    public record VendorQuotationDto(
        Guid QuotationId,
        decimal Subtotal,
        decimal TaxAmount,
        decimal TotalAmount,
        string Currency,
        DateTime? ExpectedDeliveryDate,
        string? DeliveryTerms,
        string? Remarks,
        bool SubmittedByAdmin,
        IReadOnlyCollection<VendorQuotationItemDto> Items,
        IReadOnlyCollection<VendorQuotationAttachmentDto> Attachments);

    public record VendorQuotationItemDto(
        Guid ItemId,
        Guid RfqItemId,
        decimal Quantity,
        decimal UnitPrice,
        decimal LineTotal,
        string? Notes);

    public record VendorQuotationAttachmentDto(
        Guid AttachmentId,
        string FileName,
        string StorageUrl,
        DateTime UploadedAt,
        string UploadedByUserId);

    public record SubmitVendorQuotationItemInput(
        Guid RfqItemId,
        decimal Quantity,
        decimal UnitPrice,
        string? Notes);

    public record SubmitVendorQuotationAttachmentInput(
        string FileName,
        string StorageUrl);

    public record SubmitVendorQuotationRequest(
        decimal TaxAmount,
        string Currency,
        DateTime? ExpectedDeliveryDate,
        string? DeliveryTerms,
        string? Remarks,
        IReadOnlyCollection<SubmitVendorQuotationItemInput> Items,
        IReadOnlyCollection<SubmitVendorQuotationAttachmentInput>? Attachments,
        bool SubmittedByAdmin = false,
        string? AdminNote = null);
}

