using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddTextReplaceSystemBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
INSERT OR IGNORE INTO SystemBlocks (Id, Description, Type)
VALUES (11, 'Replace text (literal or regex)', 'TextReplace');

UPDATE SystemBlocks
SET Description = 'Replace text (literal or regex)'
WHERE Type = 'TextReplace';
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 11);
        }
    }
}
