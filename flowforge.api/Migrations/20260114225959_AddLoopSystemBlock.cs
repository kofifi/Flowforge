using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddLoopSystemBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
INSERT OR IGNORE INTO SystemBlocks (Id, Description, Type)
VALUES (8, 'Loop block', 'Loop');

UPDATE SystemBlocks
SET Description = 'Loop block'
WHERE Type = 'Loop';
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 8);
        }
    }
}
