using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class JsonConfiguirationBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "JsonConfig",
                table: "Blocks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Description", "Type" },
                values: new object[] { "Blok dodawania", "Add" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JsonConfig",
                table: "Blocks");

            migrationBuilder.UpdateData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Description", "Type" },
                values: new object[] { "Blok akcji", "Action" });
        }
    }
}
