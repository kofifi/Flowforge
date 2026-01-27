using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flowforge.Migrations
{
    /// <inheritdoc />
    public partial class AddRevisionSnapshotsAndScheduler : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentRevisionId",
                table: "Workflows",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AppliedAt",
                table: "WorkflowRevisions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "WorkflowRevisions",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "WorkflowRevisions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SnapshotJson",
                table: "WorkflowRevisions",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "WorkflowSchedules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    TriggerType = table.Column<string>(type: "TEXT", nullable: false),
                    StartAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IntervalMinutes = table.Column<int>(type: "INTEGER", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastRunAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    NextRunAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    WorkflowId = table.Column<int>(type: "INTEGER", nullable: false),
                    WorkflowRevisionId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowSchedules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowSchedules_WorkflowRevisions_WorkflowRevisionId",
                        column: x => x.WorkflowRevisionId,
                        principalTable: "WorkflowRevisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WorkflowSchedules_Workflows_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "Workflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Workflows_CurrentRevisionId",
                table: "Workflows",
                column: "CurrentRevisionId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowSchedules_WorkflowId",
                table: "WorkflowSchedules",
                column: "WorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowSchedules_WorkflowRevisionId",
                table: "WorkflowSchedules",
                column: "WorkflowRevisionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Workflows_WorkflowRevisions_CurrentRevisionId",
                table: "Workflows",
                column: "CurrentRevisionId",
                principalTable: "WorkflowRevisions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workflows_WorkflowRevisions_CurrentRevisionId",
                table: "Workflows");

            migrationBuilder.DropTable(
                name: "WorkflowSchedules");

            migrationBuilder.DropIndex(
                name: "IX_Workflows_CurrentRevisionId",
                table: "Workflows");

            migrationBuilder.DropColumn(
                name: "CurrentRevisionId",
                table: "Workflows");

            migrationBuilder.DropColumn(
                name: "AppliedAt",
                table: "WorkflowRevisions");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "WorkflowRevisions");

            migrationBuilder.DropColumn(
                name: "Label",
                table: "WorkflowRevisions");

            migrationBuilder.DropColumn(
                name: "SnapshotJson",
                table: "WorkflowRevisions");
        }
    }
}
