using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLoadCancellationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Loads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "Loads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CancelledBy",
                table: "Loads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CloseReason",
                table: "Bids",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "Loads");

            migrationBuilder.DropColumn(
                name: "CloseReason",
                table: "Bids");
        }
    }
}
