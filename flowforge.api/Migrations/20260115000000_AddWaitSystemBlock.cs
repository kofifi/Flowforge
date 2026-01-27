using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddWaitSystemBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
INSERT OR IGNORE INTO SystemBlocks (Id, Description, Type)
VALUES (9, 'Wait (delay) block', 'Wait');

UPDATE SystemBlocks
SET Description = 'Wait (delay) block'
WHERE Type = 'Wait';
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemBlocks",
                keyColumn: "Id",
                keyValue: 9);
        }
    }
}
