using Flowforge.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(FlowforgeDbContext))]
    [Migration("20260701015000_AddExecutionPath")]
    public partial class AddExecutionPath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActionsData",
                table: "WorkflowExecutions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PathData",
                table: "WorkflowExecutions",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActionsData",
                table: "WorkflowExecutions");

            migrationBuilder.DropColumn(
                name: "PathData",
                table: "WorkflowExecutions");
        }
    }
}
