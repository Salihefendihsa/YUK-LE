using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yukle.Api.Migrations;

/// <inheritdoc />
public partial class PhaseD2_AdminActionLogLoadPayment : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "LoadId",
            table: "AdminActionLogs",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "PaymentId",
            table: "AdminActionLogs",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_AdminActionLogs_TimestampUtc",
            table: "AdminActionLogs",
            column: "TimestampUtc");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_AdminActionLogs_TimestampUtc",
            table: "AdminActionLogs");

        migrationBuilder.DropColumn(
            name: "LoadId",
            table: "AdminActionLogs");

        migrationBuilder.DropColumn(
            name: "PaymentId",
            table: "AdminActionLogs");
    }
}
