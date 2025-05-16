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
}