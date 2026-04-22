using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLoadAiPriceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AiMaxPrice",
                table: "Loads",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AiMinPrice",
                table: "Loads",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AiPriceReasoning",
                table: "Loads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AiSuggestedPrice",
                table: "Loads",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiMaxPrice",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "AiMinPrice",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "AiPriceReasoning",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "AiSuggestedPrice",
                table: "Loads");
        }
    }
}
