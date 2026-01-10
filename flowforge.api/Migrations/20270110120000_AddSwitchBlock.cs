using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddSwitchBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "BlockConnections",
                type: "TEXT",
                maxLength: 120,
                nullable: true);

            migrationBuilder.InsertData(
                table: "SystemBlocks",
                columns: new[] { "Id", "Description", "Type" },
                values: new object[] { 5, "Blok wielościeżkowy (case)", "Switch" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DropColumn(
                name: "Label",
                table: "BlockConnections");
        }
    }
}
