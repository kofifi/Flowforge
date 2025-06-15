using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowVariableType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TypeTemp",
                table: "WorkflowVariables",
                type: "TEXT",
                nullable: false,
                defaultValue: "String");

            migrationBuilder.Sql("UPDATE WorkflowVariables SET TypeTemp = Type");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "WorkflowVariables");

            migrationBuilder.RenameColumn(
                name: "TypeTemp",
                table: "WorkflowVariables",
                newName: "Type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TypeTemp",
                table: "WorkflowVariables",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("UPDATE WorkflowVariables SET TypeTemp = Type");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "WorkflowVariables");

            migrationBuilder.RenameColumn(
                name: "TypeTemp",
                table: "WorkflowVariables",
                newName: "Type");
        }
    }
}
