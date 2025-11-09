namespace ProcurePro.Api.DTO
{
    public record StatusBreakdownDto(string Status, int Count);

    public record MonthlySpendDto(int Year, int Month, decimal TotalAmount);

    public record ReportsOverviewDto(
        IReadOnlyCollection<StatusBreakdownDto> PurchaseRequisitions,
        IReadOnlyCollection<StatusBreakdownDto> Rfqs,
        IReadOnlyCollection<StatusBreakdownDto> PurchaseOrders,
        IReadOnlyCollection<StatusBreakdownDto> Invoices,
        IReadOnlyCollection<StatusBreakdownDto> Vendors,
        decimal TotalIssuedSpendYtd,
        decimal OutstandingInvoiceAmount,
        IReadOnlyCollection<MonthlySpendDto> MonthlyPurchaseOrderTotals);
}

