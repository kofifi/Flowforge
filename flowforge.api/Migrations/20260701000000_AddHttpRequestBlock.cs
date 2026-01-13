using Flowforge.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(FlowforgeDbContext))]
    [Migration("20260701000000_AddHttpRequestBlock")]
    public partial class AddHttpRequestBlock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO SystemBlocks (Type, Description)
                SELECT 'HttpRequest', 'Wywołanie HTTP (GET/POST itp.)'
                WHERE NOT EXISTS (
                    SELECT 1 FROM SystemBlocks WHERE Type = 'HttpRequest'
                );
            """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM SystemBlocks WHERE Type = 'HttpRequest';");
        }
    }
}
