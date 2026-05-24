using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations;

/// <inheritdoc />
public partial class EnsureFuelPricePlateCodeApplied : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "FuelPrices" ADD COLUMN IF NOT EXISTS "PlateCode" integer;
            CREATE INDEX IF NOT EXISTS "IX_FuelPrices_PlateCode_FuelType" ON "FuelPrices" ("PlateCode", "FuelType");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
    }
}
