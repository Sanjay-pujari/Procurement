using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProcurePro.Api.Migrations
{
    /// <inheritdoc />
    public partial class PurchaseOrderRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [Invoices];");
            migrationBuilder.Sql("DELETE FROM [PurchaseOrders];");

            migrationBuilder.DropForeignKey(
                name: "FK_VendorQuotationItems_RFQItems_RFQItemId",
                table: "VendorQuotationItems");

            migrationBuilder.RenameColumn(
                name: "BidId",
                table: "PurchaseOrders",
                newName: "VendorQuotationId");

            migrationBuilder.AlterColumn<decimal>(
                name: "UnitPrice",
                table: "VendorQuotationItems",
                type: "decimal(18,4)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "VendorQuotationItems",
                type: "decimal(18,4)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<DateTime>(
                name: "AcknowledgedAt",
                table: "PurchaseOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "PurchaseOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "PurchaseOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PurchaseOrderNumber",
                table: "PurchaseOrders",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VendorId",
                table: "PurchaseOrders",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_PurchaseOrderNumber",
                table: "PurchaseOrders",
                column: "PurchaseOrderNumber",
                unique: true,
                filter: "[PurchaseOrderNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_VendorId",
                table: "PurchaseOrders",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_VendorQuotationId",
                table: "PurchaseOrders",
                column: "VendorQuotationId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_VendorQuotations_VendorQuotationId",
                table: "PurchaseOrders",
                column: "VendorQuotationId",
                principalTable: "VendorQuotations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_Vendors_VendorId",
                table: "PurchaseOrders",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_VendorQuotationItems_RFQItems_RFQItemId",
                table: "VendorQuotationItems",
                column: "RFQItemId",
                principalTable: "RFQItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_VendorQuotations_VendorQuotationId",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrders_Vendors_VendorId",
                table: "PurchaseOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_VendorQuotationItems_RFQItems_RFQItemId",
                table: "VendorQuotationItems");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_PurchaseOrderNumber",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_VendorId",
                table: "PurchaseOrders");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrders_VendorQuotationId",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "AcknowledgedAt",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderNumber",
                table: "PurchaseOrders");

            migrationBuilder.DropColumn(
                name: "VendorId",
                table: "PurchaseOrders");

            migrationBuilder.RenameColumn(
                name: "VendorQuotationId",
                table: "PurchaseOrders",
                newName: "BidId");

            migrationBuilder.AlterColumn<decimal>(
                name: "UnitPrice",
                table: "VendorQuotationItems",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,4)");

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "VendorQuotationItems",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,4)");

            migrationBuilder.AddForeignKey(
                name: "FK_VendorQuotationItems_RFQItems_RFQItemId",
                table: "VendorQuotationItems",
                column: "RFQItemId",
                principalTable: "RFQItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
