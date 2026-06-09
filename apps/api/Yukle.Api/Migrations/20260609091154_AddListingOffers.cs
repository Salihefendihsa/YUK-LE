using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddListingOffers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ListingOffers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DriverListingId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoadId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListingOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ListingOffers_DriverListings_DriverListingId",
                        column: x => x.DriverListingId,
                        principalTable: "DriverListings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ListingOffers_Loads_LoadId",
                        column: x => x.LoadId,
                        principalTable: "Loads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ListingOffers_Users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ListingOffers_CustomerId",
                table: "ListingOffers",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ListingOffers_DriverListingId_Status",
                table: "ListingOffers",
                columns: new[] { "DriverListingId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ListingOffers_LoadId",
                table: "ListingOffers",
                column: "LoadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ListingOffers");
        }
    }
}
