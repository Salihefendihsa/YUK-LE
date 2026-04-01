using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddModelRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Loads_Users_DriverId",
                table: "Loads");

            migrationBuilder.DropForeignKey(
                name: "FK_Loads_Users_OwnerId",
                table: "Loads");

            migrationBuilder.AddForeignKey(
                name: "FK_Loads_Users_DriverId",
                table: "Loads",
                column: "DriverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Loads_Users_OwnerId",
                table: "Loads",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Loads_Users_DriverId",
                table: "Loads");

            migrationBuilder.DropForeignKey(
                name: "FK_Loads_Users_OwnerId",
                table: "Loads");

            migrationBuilder.AddForeignKey(
                name: "FK_Loads_Users_DriverId",
                table: "Loads",
                column: "DriverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Loads_Users_OwnerId",
                table: "Loads",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
