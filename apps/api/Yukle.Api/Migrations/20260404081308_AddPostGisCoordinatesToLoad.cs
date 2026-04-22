using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPostGisCoordinatesToLoad : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Point>(
                name: "Destination",
                table: "Loads",
                type: "geometry(Point, 4326)",
                nullable: false);

            migrationBuilder.AddColumn<Point>(
                name: "Origin",
                table: "Loads",
                type: "geometry(Point, 4326)",
                nullable: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Destination",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "Origin",
                table: "Loads");
        }
    }
}
