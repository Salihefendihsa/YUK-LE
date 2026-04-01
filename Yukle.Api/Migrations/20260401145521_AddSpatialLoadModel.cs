using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSpatialLoadModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Loads_DestinationLocation",
                table: "Loads");

            migrationBuilder.DropIndex(
                name: "IX_Loads_OriginLocation",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "DestinationLocation",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "OriginLocation",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Loads");

            migrationBuilder.AlterColumn<decimal>(
                name: "Weight",
                table: "Loads",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(double),
                oldType: "double precision");

            migrationBuilder.AddColumn<Point>(
                name: "Destination",
                table: "Loads",
                type: "geometry (point, 4326)",
                nullable: false);

            migrationBuilder.AddColumn<int>(
                name: "DriverId",
                table: "Loads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Point>(
                name: "Origin",
                table: "Loads",
                type: "geometry (point, 4326)",
                nullable: false);

            migrationBuilder.AddColumn<int>(
                name: "OwnerId",
                table: "Loads",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupDate",
                table: "Loads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Loads",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Loads",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Loads",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "VehicleId",
                table: "Loads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Volume",
                table: "Loads",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_Loads_Destination",
                table: "Loads",
                column: "Destination")
                .Annotation("Npgsql:IndexMethod", "GIST");

            migrationBuilder.CreateIndex(
                name: "IX_Loads_DriverId",
                table: "Loads",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Loads_Origin",
                table: "Loads",
                column: "Origin")
                .Annotation("Npgsql:IndexMethod", "GIST");

            migrationBuilder.CreateIndex(
                name: "IX_Loads_OwnerId",
                table: "Loads",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Loads_VehicleId",
                table: "Loads",
                column: "VehicleId");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Loads_Vehicles_VehicleId",
                table: "Loads",
                column: "VehicleId",
                principalTable: "Vehicles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
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

            migrationBuilder.DropForeignKey(
                name: "FK_Loads_Vehicles_VehicleId",
                table: "Loads");

            migrationBuilder.DropIndex(
                name: "IX_Loads_Destination",
                table: "Loads");

            migrationBuilder.DropIndex(
                name: "IX_Loads_DriverId",
                table: "Loads");

            migrationBuilder.DropIndex(
                name: "IX_Loads_Origin",
                table: "Loads");

            migrationBuilder.DropIndex(
                name: "IX_Loads_OwnerId",
                table: "Loads");

            migrationBuilder.DropIndex(
                name: "IX_Loads_VehicleId",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "Destination",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "DriverId",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "Origin",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "PickupDate",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "VehicleId",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "Volume",
                table: "Loads");

            migrationBuilder.AlterColumn<double>(
                name: "Weight",
                table: "Loads",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Loads",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Point>(
                name: "DestinationLocation",
                table: "Loads",
                type: "geometry",
                nullable: true);

            migrationBuilder.AddColumn<Point>(
                name: "OriginLocation",
                table: "Loads",
                type: "geometry",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Loads",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Loads_DestinationLocation",
                table: "Loads",
                column: "DestinationLocation")
                .Annotation("Npgsql:IndexMethod", "GIST");

            migrationBuilder.CreateIndex(
                name: "IX_Loads_OriginLocation",
                table: "Loads",
                column: "OriginLocation")
                .Annotation("Npgsql:IndexMethod", "GIST");
        }
    }
}
