using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProcurePro.Api.Migrations
{
    /// <inheritdoc />
    public partial class VendorQuotationModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VendorQuotations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RFQId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VendorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpectedDeliveryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveryTerms = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedByAdmin = table.Column<bool>(type: "bit", nullable: false),
                    AdminNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorQuotations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorQuotations_RFQs_RFQId",
                        column: x => x.RFQId,
                        principalTable: "RFQs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VendorQuotations_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VendorQuotationAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VendorQuotationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StorageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorQuotationAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorQuotationAttachments_VendorQuotations_VendorQuotationId",
                        column: x => x.VendorQuotationId,
                        principalTable: "VendorQuotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VendorQuotationItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VendorQuotationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RFQItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorQuotationItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorQuotationItems_RFQItems_RFQItemId",
                        column: x => x.RFQItemId,
                        principalTable: "RFQItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorQuotationItems_VendorQuotations_VendorQuotationId",
                        column: x => x.VendorQuotationId,
                        principalTable: "VendorQuotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorQuotationAttachments_VendorQuotationId",
                table: "VendorQuotationAttachments",
                column: "VendorQuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorQuotationItems_RFQItemId",
                table: "VendorQuotationItems",
                column: "RFQItemId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorQuotationItems_VendorQuotationId",
                table: "VendorQuotationItems",
                column: "VendorQuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorQuotations_RFQId",
                table: "VendorQuotations",
                column: "RFQId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorQuotations_VendorId",
                table: "VendorQuotations",
                column: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VendorQuotationAttachments");

            migrationBuilder.DropTable(
                name: "VendorQuotationItems");

            migrationBuilder.DropTable(
                name: "VendorQuotations");
        }
    }
}
