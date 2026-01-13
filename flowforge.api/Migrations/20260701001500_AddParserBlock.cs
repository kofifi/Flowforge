using Flowforge.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(FlowforgeDbContext))]
    [Migration("20260701001500_AddParserBlock")]
    public partial class AddParserBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO SystemBlocks (Type, Description)
                SELECT 'Parser', 'Parser JSON/XML'
                WHERE NOT EXISTS (
                    SELECT 1 FROM SystemBlocks WHERE Type = 'Parser'
                );
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM SystemBlocks WHERE Type = 'Parser';");
        }
    }
}
