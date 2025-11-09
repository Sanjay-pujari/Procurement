using System;
using System.Collections.Generic;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.DTO
{
    public record RfqSummaryDto(
        Guid Id,
        string ReferenceNumber,
        string Title,
        RFQStatus Status,
        DateTime DueDate,
        DateTime CreatedAt,
        int ItemCount,
        int VendorCount,
        string? PurchaseRequisitionNumber);

    public record RfqItemDto(
        Guid Id,
        string Description,
        string? Specification,
        int Quantity,
        string? Unit);

    public record RfqAttachmentDto(
        Guid Id,
        string FileName,
        string StorageUrl,
        DateTime UploadedAt,
        string UploadedByUserId);

    public record RfqVendorDto(
        Guid Id,
        Guid VendorId,
        string VendorName,
        RfqVendorStatus Status,
        DateTime? InvitationSentAt,
        DateTime? AcknowledgedAt,
        DateTime? QuoteSubmittedAt,
        string? Notes);

    public record RfqDetailDto(
        Guid Id,
        string ReferenceNumber,
        string Title,
        string? Terms,
        RFQStatus Status,
        DateTime DueDate,
        DateTime CreatedAt,
        DateTime? PublishedAt,
        DateTime? ClosedAt,
        Guid? PurchaseRequisitionId,
        string? PurchaseRequisitionNumber,
        IReadOnlyCollection<RfqItemDto> Items,
        IReadOnlyCollection<RfqAttachmentDto> Attachments,
        IReadOnlyCollection<RfqVendorDto> Vendors);

    public record RfqAttachmentInput(string FileName, string StorageUrl);

    public record RfqVendorInput(Guid VendorId, string? Notes);

    public record CreateRfqItemInput(
        string Description,
        string? Specification,
        int Quantity,
        string? Unit);

    public record CreateRfqRequest(
        string Title,
        string? Terms,
        DateTime DueDate,
        Guid? PurchaseRequisitionId,
        IReadOnlyCollection<CreateRfqItemInput> Items,
        IReadOnlyCollection<RfqAttachmentInput>? Attachments,
        IReadOnlyCollection<RfqVendorInput> Vendors);

    public record ConvertPrToRfqRequest(
        Guid PurchaseRequisitionId,
        string Title,
        string? Terms,
        DateTime DueDate,
        IReadOnlyCollection<RfqAttachmentInput>? Attachments,
        IReadOnlyCollection<RfqVendorInput> Vendors);

    public record UpdateRfqRequest(
        string Title,
        string? Terms,
        DateTime DueDate,
        IReadOnlyCollection<CreateRfqItemInput> Items,
        IReadOnlyCollection<RfqAttachmentInput>? Attachments,
        IReadOnlyCollection<RfqVendorInput> Vendors);

    public record SendInvitationRequest(
        IReadOnlyCollection<Guid> VendorIds);

    public record VendorAcknowledgeRequest(
        bool Accepted,
        string? Notes);
}

