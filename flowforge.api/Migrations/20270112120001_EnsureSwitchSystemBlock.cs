using Flowforge.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(FlowforgeDbContext))]
    [Migration("20270112120001_EnsureSwitchSystemBlock")]
    public partial class EnsureSwitchSystemBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure Switch system block exists without breaking existing data.
            migrationBuilder.Sql("""
                INSERT OR IGNORE INTO SystemBlocks (Id, Type, Description)
                VALUES (5, 'Switch', 'Blok wielościeżkowy (case)');
                UPDATE SystemBlocks
                SET Description = 'Blok wielościeżkowy (case)'
                WHERE Type = 'Switch';
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM SystemBlocks WHERE Type = 'Switch';");
        }
    }
}
