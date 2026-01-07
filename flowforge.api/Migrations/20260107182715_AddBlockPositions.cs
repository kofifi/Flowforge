using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddBlockPositions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "PositionX",
                table: "Blocks",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PositionY",
                table: "Blocks",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PositionX",
                table: "Blocks");

            migrationBuilder.DropColumn(
                name: "PositionY",
                table: "Blocks");
        }
    }
}
