using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddParserBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "SystemBlocks",
                columns: new[] { "Id", "Description", "Type" },
                values: new object[] { 7, "Parser JSON/XML", "Parser" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 7);
        }
    }
}
