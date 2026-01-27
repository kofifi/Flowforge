using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSystemBlockDescriptionsToEnglish : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 1,
                column: "Description",
                value: "Start block");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 2,
                column: "Description",
                value: "End block");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 3,
                column: "Description",
                value: "Calculation block");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 4,
                column: "Description",
                value: "Conditional block");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 5,
                column: "Description",
                value: "Switch (case) block");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 6,
                column: "Description",
                value: "HTTP request block");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 1,
                column: "Description",
                value: "Blok początkowy");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 2,
                column: "Description",
                value: "Blok końcowy");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 3,
                column: "Description",
                value: "Blok kalkulacji");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 4,
                column: "Description",
                value: "Blok warunkowy");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 5,
                column: "Description",
                value: "Blok wielościeżkowy (case)");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 6,
                column: "Description",
                value: "Wywołanie HTTP (GET/POST itp.)");
        }
    }
}
