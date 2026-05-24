using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletCustomerRefundUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_WalletAuditLogs_CustomerRefund_Unique",
                table: "WalletAuditLogs",
                columns: new[] { "LoadId", "UserId", "Reason" },
                unique: true,
                filter: "\"Type\" = 5 AND \"Reason\" LIKE 'Iptal/Iade REFUND load=%'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WalletAuditLogs_CustomerRefund_Unique",
                table: "WalletAuditLogs");
        }
    }
}
