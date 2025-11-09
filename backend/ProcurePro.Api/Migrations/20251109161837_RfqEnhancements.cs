using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProcurePro.Api.Migrations
{
    /// <inheritdoc />
    public partial class RfqEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AcknowledgedAt",
                table: "RFQVendors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InvitationSentAt",
                table: "RFQVendors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReminderSentAt",
                table: "RFQVendors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "RFQVendors",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "QuoteSubmittedAt",
                table: "RFQVendors",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "RFQVendors",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ClosedAt",
                table: "RFQs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "RFQs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "RFQs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseRequisitionId",
                table: "RFQs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceNumber",
                table: "RFQs",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(@"
UPDATE RFQs
SET CreatedAt = GETUTCDATE()
WHERE CreatedAt = '0001-01-01T00:00:00.0000000';

WITH toUpdate AS (
    SELECT Id,
           ROW_NUMBER() OVER (ORDER BY Id) AS RowNum
    FROM RFQs
    WHERE ISNULL(ReferenceNumber, '') = ''
)
UPDATE r
SET ReferenceNumber = 'RFQ-' + CONVERT(varchar(8), GETUTCDATE(), 112) + '-' + RIGHT('0000' + CAST(t.RowNum AS varchar(4)), 4)
FROM RFQs r
INNER JOIN toUpdate t ON r.Id = t.Id;
");

            migrationBuilder.CreateTable(
                name: "RFQAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RFQId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StorageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RFQAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RFQAttachments_RFQs_RFQId",
                        column: x => x.RFQId,
                        principalTable: "RFQs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RFQs_ReferenceNumber",
                table: "RFQs",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RFQAttachments_RFQId",
                table: "RFQAttachments",
                column: "RFQId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RFQAttachments");

            migrationBuilder.DropIndex(
                name: "IX_RFQs_ReferenceNumber",
                table: "RFQs");

            migrationBuilder.DropColumn(
                name: "AcknowledgedAt",
                table: "RFQVendors");

            migrationBuilder.DropColumn(
                name: "InvitationSentAt",
                table: "RFQVendors");

            migrationBuilder.DropColumn(
                name: "LastReminderSentAt",
                table: "RFQVendors");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "RFQVendors");

            migrationBuilder.DropColumn(
                name: "QuoteSubmittedAt",
                table: "RFQVendors");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "RFQVendors");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "RFQs");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "RFQs");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "RFQs");

            migrationBuilder.DropColumn(
                name: "PurchaseRequisitionId",
                table: "RFQs");

            migrationBuilder.DropColumn(
                name: "ReferenceNumber",
                table: "RFQs");
        }
    }
}
