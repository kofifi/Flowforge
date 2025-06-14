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

        // Workflow 1:N WorkflowExecution
        modelBuilder.Entity<WorkflowExecution>()
            .HasOne(we => we.Workflow)
            .WithMany(w => w.WorkflowExecutions)
            .HasForeignKey(we => we.WorkflowId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed data for SystemBlocks
        modelBuilder.Entity<SystemBlock>().HasData(
            new SystemBlock { Id = 1, Type = "Start", Description = "Blok początkowy" },
            new SystemBlock { Id = 2, Type = "End", Description = "Blok końcowy" },
            new SystemBlock { Id = 3, Type = "Calculation", Description = "Blok kalkulacji" }
        );
    }
}