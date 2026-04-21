using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingReviewAndAdminFieldsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminReviewNote",
                table: "Users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiInferenceDetails",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role_ApprovalStatus",
                table: "Users",
                columns: new[] { "Role", "ApprovalStatus" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Role_ApprovalStatus",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AdminReviewNote",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AiInferenceDetails",
                table: "Users");
        }
    }
}
