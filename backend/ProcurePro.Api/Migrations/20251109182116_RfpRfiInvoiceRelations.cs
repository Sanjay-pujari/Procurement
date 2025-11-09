using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProcurePro.Api.Migrations
{
    /// <inheritdoc />
    public partial class RfpRfiInvoiceRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_RFPs_RFQId",
                table: "RFPs",
                column: "RFQId");

            migrationBuilder.CreateIndex(
                name: "IX_RFIs_RFPId",
                table: "RFIs",
                column: "RFPId");

            migrationBuilder.CreateIndex(
                name: "IX_RFIs_RFQId",
                table: "RFIs",
                column: "RFQId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_PurchaseOrderId",
                table: "Invoices",
                column: "PurchaseOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_PurchaseOrders_PurchaseOrderId",
                table: "Invoices",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RFIs_RFPs_RFPId",
                table: "RFIs",
                column: "RFPId",
                principalTable: "RFPs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RFIs_RFQs_RFQId",
                table: "RFIs",
                column: "RFQId",
                principalTable: "RFQs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RFPs_RFQs_RFQId",
                table: "RFPs",
                column: "RFQId",
                principalTable: "RFQs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_PurchaseOrders_PurchaseOrderId",
                table: "Invoices");

            migrationBuilder.DropForeignKey(
                name: "FK_RFIs_RFPs_RFPId",
                table: "RFIs");

            migrationBuilder.DropForeignKey(
                name: "FK_RFIs_RFQs_RFQId",
                table: "RFIs");

            migrationBuilder.DropForeignKey(
                name: "FK_RFPs_RFQs_RFQId",
                table: "RFPs");

            migrationBuilder.DropIndex(
                name: "IX_RFPs_RFQId",
                table: "RFPs");

            migrationBuilder.DropIndex(
                name: "IX_RFIs_RFPId",
                table: "RFIs");

            migrationBuilder.DropIndex(
                name: "IX_RFIs_RFQId",
                table: "RFIs");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_PurchaseOrderId",
                table: "Invoices");
        }
    }
}
