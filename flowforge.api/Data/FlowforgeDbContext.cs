using Microsoft.EntityFrameworkCore;
using Flowforge.Models;

namespace Flowforge.Data;

public class FlowforgeDbContext : DbContext
{
    public FlowforgeDbContext(DbContextOptions<FlowforgeDbContext> options)
        : base(options)
    {
    }

    public DbSet<Workflow> Workflows { get; set; }
    public DbSet<Block> Blocks { get; set; }
    public DbSet<SystemBlock> SystemBlocks { get; set; }
    public DbSet<BlockConnection> BlockConnections { get; set; }
    public DbSet<WorkflowVariable> WorkflowVariables { get; set; }
    public DbSet<WorkflowRevision> WorkflowRevisions { get; set; }
    public DbSet<WorkflowExecution> WorkflowExecutions { get; set; }
    public DbSet<WorkflowSchedule> WorkflowSchedules { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Workflow 1:N Block
        modelBuilder.Entity<Block>()
            .HasOne(b => b.Workflow)
            .WithMany(w => w.Blocks)
            .HasForeignKey(b => b.WorkflowId)
            .OnDelete(DeleteBehavior.Cascade);

        // Block N:1 SystemBlock
        modelBuilder.Entity<Block>()
            .HasOne(b => b.SystemBlock)
            .WithMany(sb => sb.Blocks)
            .HasForeignKey(b => b.SystemBlockId)
            .OnDelete(DeleteBehavior.Restrict);

        // Block 1:N BlockConnection (Source)
        modelBuilder.Entity<Block>()
            .HasMany(b => b.SourceConnections)
            .WithOne(bc => bc.SourceBlock)
            .HasForeignKey(bc => bc.SourceBlockId)
            .OnDelete(DeleteBehavior.Restrict);

        // Block 1:N BlockConnection (Target)
        modelBuilder.Entity<Block>()
            .HasMany(b => b.TargetConnections)
            .WithOne(bc => bc.TargetBlock)
            .HasForeignKey(bc => bc.TargetBlockId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BlockConnection>()
            .Property(bc => bc.ConnectionType)
            .HasConversion<string>();
        modelBuilder.Entity<BlockConnection>()
            .Property(bc => bc.Label)
            .HasMaxLength(120);

        // Workflow 1:N WorkflowVariable
        modelBuilder.Entity<WorkflowVariable>()
            .HasOne(wv => wv.Workflow)
            .WithMany(w => w.WorkflowVariables)
            .HasForeignKey(wv => wv.WorkflowId)
            .OnDelete(DeleteBehavior.Cascade);

        // Workflow 1:N WorkflowRevision
        modelBuilder.Entity<WorkflowRevision>()
            .HasOne(wr => wr.Workflow)
            .WithMany(w => w.WorkflowRevisions)
            .HasForeignKey(wr => wr.WorkflowId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Workflow>()
            .HasOne(w => w.CurrentRevision)
            .WithMany()
            .HasForeignKey(w => w.CurrentRevisionId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<WorkflowSchedule>()
            .HasOne(ws => ws.Workflow)
            .WithMany()
            .HasForeignKey(ws => ws.WorkflowId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkflowSchedule>()
            .HasOne(ws => ws.WorkflowRevision)
            .WithMany()
            .HasForeignKey(ws => ws.WorkflowRevisionId)
            .OnDelete(DeleteBehavior.SetNull);

        // Workflow 1:N WorkflowExecution
        modelBuilder.Entity<WorkflowExecution>()
            .HasOne(we => we.Workflow)
            .WithMany(w => w.WorkflowExecutions)
            .HasForeignKey(we => we.WorkflowId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed data for SystemBlocks
        modelBuilder.Entity<SystemBlock>().HasData(
            new SystemBlock { Id = 1, Type = "Start", Description = "Start block" },
            new SystemBlock { Id = 2, Type = "End", Description = "End block" },
            new SystemBlock { Id = 3, Type = "Calculation", Description = "Calculation block" },
            new SystemBlock { Id = 4, Type = "If", Description = "Conditional block" },
            new SystemBlock { Id = 5, Type = "Switch", Description = "Switch (case) block" },
            new SystemBlock { Id = 6, Type = "HttpRequest", Description = "HTTP request block" },
            new SystemBlock { Id = 7, Type = "Parser", Description = "Parser JSON/XML" },
            new SystemBlock { Id = 8, Type = "Loop", Description = "Loop block" },
            new SystemBlock { Id = 9, Type = "Wait", Description = "Wait (delay) block" },
            new SystemBlock { Id = 10, Type = "TextTransform", Description = "Transform text casing" },
            new SystemBlock { Id = 11, Type = "TextReplace", Description = "Replace text (literal or regex)" }
        );
    }
}
