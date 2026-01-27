using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddTextTransformSystemBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
INSERT OR IGNORE INTO SystemBlocks (Id, Description, Type)
VALUES (10, 'Transform text casing', 'TextTransform');

UPDATE SystemBlocks
SET Description = 'Transform text casing'
WHERE Type = 'TextTransform';
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 10);
        }
    }
}
