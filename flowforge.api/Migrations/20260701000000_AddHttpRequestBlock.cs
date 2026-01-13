using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddHttpRequestBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "SystemBlocks",
                columns: new[] { "Id", "Description", "Type" },
                values: new object[] { 6, "Wywołanie HTTP (GET/POST itp.)", "HttpRequest" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 6);
        }
    }
}
