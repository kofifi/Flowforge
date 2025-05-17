using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class WorkflowRevisionRepositoryTests
{
    private FlowforgeDbContext _context = null!;
    private WorkflowRevisionRepository _repository = null!;

    [SetUp]
    public void SetUp()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new FlowforgeDbContext(options);
        _context.Database.EnsureCreated();
        _repository = new WorkflowRevisionRepository(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task AddAsync_AddsRevision()
    {
        var workflow = new Workflow { Name = "TestWorkflow" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var revision = new WorkflowRevision
        {
            Version = "v1",
            CreatedAt = DateTime.UtcNow,
            WorkflowId = workflow.Id
        };

        var result = await _repository.AddAsync(revision);

        Assert.That(result.Id, Is.Not.EqualTo(0));
        Assert.That(_context.WorkflowRevisions.Count(), Is.EqualTo(1));
        Assert.That(_context.WorkflowRevisions.First().Version, Is.EqualTo("v1"));
    }

    [Test]
    public async Task GetAllAsync_ReturnsAllRevisions()
    {
        var workflow = new Workflow { Name = "TestWorkflow" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        _context.WorkflowRevisions.Add(new WorkflowRevision { Version = "v1", CreatedAt = DateTime.UtcNow, WorkflowId = workflow.Id });
        _context.WorkflowRevisions.Add(new WorkflowRevision { Version = "v2", CreatedAt = DateTime.UtcNow, WorkflowId = workflow.Id });
        await _context.SaveChangesAsync();

        var revisions = await _repository.GetAllAsync();

        Assert.That(revisions.Count(), Is.EqualTo(2));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsRevision_WhenExists()
    {
        var workflow = new Workflow { Name = "TestWorkflow" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var revision = new WorkflowRevision { Version = "v1", CreatedAt = DateTime.UtcNow, WorkflowId = workflow.Id };
        _context.WorkflowRevisions.Add(revision);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(revision.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Version, Is.EqualTo("v1"));
        Assert.That(result.Workflow, Is.Not.Null);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        var result = await _repository.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateAsync_UpdatesRevision_WhenExists()
    {
        var workflow = new Workflow { Name = "TestWorkflow" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var revision = new WorkflowRevision { Version = "v1", CreatedAt = DateTime.UtcNow, WorkflowId = workflow.Id };
        _context.WorkflowRevisions.Add(revision);
        await _context.SaveChangesAsync();

        revision.Version = "v2";
        var updated = await _repository.UpdateAsync(revision);

        Assert.That(updated, Is.True);
        Assert.That(_context.WorkflowRevisions.First().Version, Is.EqualTo("v2"));
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenNotExists()
    {
        var revision = new WorkflowRevision { Id = 123, Version = "v1", CreatedAt = DateTime.UtcNow, WorkflowId = 1 };
        var updated = await _repository.UpdateAsync(revision);

        Assert.That(updated, Is.False);
    }

    [Test]
    public async Task DeleteAsync_DeletesRevision_WhenExists()
    {
        var workflow = new Workflow { Name = "TestWorkflow" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var revision = new WorkflowRevision { Version = "v1", CreatedAt = DateTime.UtcNow, WorkflowId = workflow.Id };
        _context.WorkflowRevisions.Add(revision);
        await _context.SaveChangesAsync();

        var deleted = await _repository.DeleteAsync(revision.Id);

        Assert.That(deleted, Is.True);
        Assert.That(_context.WorkflowRevisions.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        var deleted = await _repository.DeleteAsync(999);
        Assert.That(deleted, Is.False);
    }
}