using System;
using System.Collections.Generic;
using ProcurePro.Api.Modules;

namespace ProcurePro.Api.DTO
{
    public record PurchaseOrderSummaryDto(
        Guid Id,
        string PurchaseOrderNumber,
        Guid VendorId,
        Guid VendorQuotationId,
        PurchaseOrderStatus Status,
        DateTime CreatedAt,
        DateTime? AcknowledgedAt,
        DateTime? CompletedAt);

    public record PurchaseOrderItemDto(
        Guid RfqItemId,
        decimal Quantity,
        decimal UnitPrice,
        decimal LineTotal,
        string? Notes);

    public record PurchaseOrderDetailDto(
        Guid Id,
        string PurchaseOrderNumber,
        Guid VendorId,
        Guid VendorQuotationId,
        PurchaseOrderStatus Status,
        DateTime CreatedAt,
        DateTime? AcknowledgedAt,
        DateTime? CompletedAt,
        string Currency,
        decimal TotalAmount,
        IReadOnlyCollection<PurchaseOrderItemDto> Items,
        string? AmendmentsJson);

    public record IssuePurchaseOrderRequest(Guid VendorQuotationId, string? AmendmentsJson);
}

