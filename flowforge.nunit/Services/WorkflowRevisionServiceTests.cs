using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Flowforge.Services;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class WorkflowRevisionServiceTests
{
    private FlowforgeDbContext _context = null!;
    private WorkflowRevisionService _service = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(databaseName: $"revisions-{System.Guid.NewGuid()}")
            .Options;
        _context = new FlowforgeDbContext(options);

        _context.SystemBlocks.AddRange(
            new SystemBlock { Id = 1, Type = "Start", Description = "Start" },
            new SystemBlock { Id = 2, Type = "End", Description = "End" }
        );
        _context.SaveChanges();

        var revisionRepo = new WorkflowRevisionRepository(_context);
        var workflowRepo = new WorkflowRepository(_context);
        var systemBlockService = new SystemBlockService(new SystemBlockRepository(_context));
        _service = new WorkflowRevisionService(revisionRepo, workflowRepo, _context, systemBlockService);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task CreateSnapshotAsync_PersistsRevisionAndMarksActive()
    {
        var workflow = await SeedWorkflowAsync();

        var revision = await _service.CreateSnapshotAsync(workflow.Id, "label-1");

        Assert.That(revision.Version, Is.EqualTo("v1"));
        Assert.That(revision.IsActive, Is.True);
        var stored = await _service.GetLatestByWorkflowIdAsync(workflow.Id);
        Assert.That(stored?.Id, Is.EqualTo(revision.Id));
    }

    [Test]
    public async Task RestoreRevisionAsync_RebuildsBlocksAndConnections()
    {
        var workflow = await SeedWorkflowAsync();
        var revision = await _service.CreateSnapshotAsync(workflow.Id, "first");

        var conns = _context.BlockConnections.Where(c => c.SourceBlock!.WorkflowId == workflow.Id || c.TargetBlock!.WorkflowId == workflow.Id).ToList();
        _context.BlockConnections.RemoveRange(conns);
        var blocks = _context.Blocks.Where(b => b.WorkflowId == workflow.Id).ToList();
        _context.Blocks.RemoveRange(blocks);
        await _context.SaveChangesAsync();

        var restored = await _service.RestoreRevisionAsync(workflow.Id, revision.Id);

        Assert.That(restored, Is.True);
        var restoredBlocks = _context.Blocks.Where(b => b.WorkflowId == workflow.Id).ToList();
        Assert.That(restoredBlocks.Count, Is.EqualTo(2));
        var restoredConnections = _context.BlockConnections.ToList();
        Assert.That(restoredConnections.Count, Is.EqualTo(1));
    }

    private async Task<Workflow> SeedWorkflowAsync()
    {
        var workflow = new Workflow { Name = "Test workflow" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var start = new Block
        {
            Name = "Start",
            WorkflowId = workflow.Id,
            SystemBlockId = 1
        };
        var end = new Block
        {
            Name = "End",
            WorkflowId = workflow.Id,
            SystemBlockId = 2
        };

        _context.Blocks.AddRange(start, end);
        await _context.SaveChangesAsync();

        _context.BlockConnections.Add(new BlockConnection
        {
            SourceBlockId = start.Id,
            TargetBlockId = end.Id,
            ConnectionType = ConnectionType.Success
        });

        await _context.SaveChangesAsync();
        return workflow;
    }
}
