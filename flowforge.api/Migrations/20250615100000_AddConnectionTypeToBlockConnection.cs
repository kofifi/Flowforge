using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddConnectionTypeToBlockConnection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConnectionType",
                table: "BlockConnections",
                type: "TEXT",
                nullable: false,
                defaultValue: "Success");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConnectionType",
                table: "BlockConnections");
        }
    }
}
