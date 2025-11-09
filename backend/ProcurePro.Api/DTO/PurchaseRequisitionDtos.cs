using System;
using System.Collections.Generic;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.DTO
{
    public record PurchaseRequisitionItemDto(
        Guid Id,
        string ItemName,
        string? Specification,
        int Quantity,
        string? UnitOfMeasure,
        decimal EstimatedUnitCost);

    public record PurchaseRequisitionAttachmentDto(
        Guid Id,
        string FileName,
        string StorageUrl,
        string UploadedByUserId,
        DateTime UploadedAt);

    public record PurchaseRequisitionApprovalDto(
        Guid Id,
        int Sequence,
        string ApproverUserId,
        PurchaseRequisitionApprovalStatus Status,
        DateTime? ActionedAt,
        string? Comments);

    public record PurchaseRequisitionSummaryDto(
        Guid Id,
        string PrNumber,
        string Title,
        PurchaseRequisitionStatus Status,
        PurchaseRequisitionUrgency Urgency,
        DateTime NeededBy,
        DateTime CreatedAt,
        string RequestedByUserId);

    public record PurchaseRequisitionDetailDto(
        Guid Id,
        string PrNumber,
        string Title,
        string? Description,
        string CostCenter,
        string? Department,
        PurchaseRequisitionUrgency Urgency,
        PurchaseRequisitionStatus Status,
        DateTime NeededBy,
        DateTime CreatedAt,
        DateTime? SubmittedAt,
        DateTime? ApprovedAt,
        string RequestedByUserId,
        IReadOnlyCollection<PurchaseRequisitionItemDto> Items,
        IReadOnlyCollection<PurchaseRequisitionAttachmentDto> Attachments,
        IReadOnlyCollection<PurchaseRequisitionApprovalDto> Approvals);

    public record CreatePurchaseRequisitionItemInput(
        string ItemName,
        string? Specification,
        int Quantity,
        string? UnitOfMeasure,
        decimal EstimatedUnitCost);

    public record CreatePurchaseRequisitionAttachmentInput(
        string FileName,
        string StorageUrl);

    public record CreatePurchaseRequisitionRequest(
        string Title,
        string? Description,
        string CostCenter,
        string? Department,
        PurchaseRequisitionUrgency Urgency,
        DateTime NeededBy,
        IReadOnlyCollection<CreatePurchaseRequisitionItemInput> Items,
        IReadOnlyCollection<CreatePurchaseRequisitionAttachmentInput>? Attachments,
        IReadOnlyCollection<string> ApproverUserIds);

    public record SubmitPurchaseRequisitionRequest(
        IReadOnlyCollection<string>? ApproverUserIds);

    public record ApprovalActionRequest(
        string? Comments);
}

