using Flowforge.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations;

/// <inheritdoc />
[DbContext(typeof(FlowforgeDbContext))]
[Migration("20250615100500_AddIfSystemBlock")]
public partial class AddIfSystemBlock : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            INSERT INTO SystemBlocks (Type, Description)
            SELECT 'If', 'Blok warunkowy'
            WHERE NOT EXISTS (
                SELECT 1 FROM SystemBlocks WHERE Type = 'If'
            );
        """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DELETE FROM SystemBlocks WHERE Type = 'If';");
    }
}
