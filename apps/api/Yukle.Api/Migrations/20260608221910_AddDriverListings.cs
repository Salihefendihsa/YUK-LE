using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverListings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DriverListings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DriverId = table.Column<int>(type: "integer", nullable: false),
                    OriginCity = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OriginDistrict = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Origin = table.Column<Point>(type: "geometry(Point, 4326)", nullable: false),
                    DestinationCity = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DestinationDistrict = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Destination = table.Column<Point>(type: "geometry(Point, 4326)", nullable: false),
                    AvailableFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VehicleType = table.Column<int>(type: "integer", nullable: false),
                    CapacityNote = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DriverListings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DriverListings_Users_DriverId",
                        column: x => x.DriverId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DriverListings_DriverId",
                table: "DriverListings",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_DriverListings_Status_AvailableFrom",
                table: "DriverListings",
                columns: new[] { "Status", "AvailableFrom" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DriverListings");
        }
    }
}
