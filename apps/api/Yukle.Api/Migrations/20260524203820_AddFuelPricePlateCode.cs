using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations;

/// <inheritdoc />
public partial class AddFuelPricePlateCode : Migration
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
        migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_FuelPrices_PlateCode_FuelType\";");
        migrationBuilder.Sql("ALTER TABLE \"FuelPrices\" DROP COLUMN IF EXISTS \"PlateCode\";");
    }
}
