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
public class WorkflowExecutionRepositoryTests
{
    private FlowforgeDbContext _context;
    private WorkflowExecutionRepository _repository;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new FlowforgeDbContext(options);
        _context.Database.EnsureCreated();
        _repository = new WorkflowExecutionRepository(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task AddAsync_AddsExecution()
    {
        var workflow = new Workflow { Name = "Test" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var execution = new WorkflowExecution { ExecutedAt = DateTime.UtcNow, WorkflowId = workflow.Id };
        var result = await _repository.AddAsync(execution);

        Assert.That(result.Id, Is.Not.EqualTo(0));
        Assert.That(_context.WorkflowExecutions.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetAllAsync_ReturnsAllExecutions()
    {
        var workflow1 = new Workflow { Name = "Test1" };
        var workflow2 = new Workflow { Name = "Test2" };
        _context.Workflows.AddRange(workflow1, workflow2);
        await _context.SaveChangesAsync();

        _context.WorkflowExecutions.Add(new WorkflowExecution { ExecutedAt = DateTime.UtcNow, WorkflowId = workflow1.Id });
        _context.WorkflowExecutions.Add(new WorkflowExecution { ExecutedAt = DateTime.UtcNow, WorkflowId = workflow2.Id });
        await _context.SaveChangesAsync();

        var executions = await _repository.GetAllAsync();

        Assert.That(executions.Count(), Is.EqualTo(2));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsExecution_WhenExists()
    {
        var workflow = new Workflow { Name = "Test" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var execution = new WorkflowExecution { ExecutedAt = DateTime.UtcNow, WorkflowId = workflow.Id };
        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(execution.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.WorkflowId, Is.EqualTo(workflow.Id));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        var result = await _repository.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateAsync_UpdatesExecution_WhenExists()
    {
        var workflow = new Workflow { Name = "Test" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var execution = new WorkflowExecution { ExecutedAt = DateTime.UtcNow, WorkflowId = workflow.Id };
        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync();

        execution.ResultData = "OK";
        var updated = await _repository.UpdateAsync(execution);

        Assert.That(updated, Is.True);
        Assert.That(_context.WorkflowExecutions.First().ResultData, Is.EqualTo("OK"));
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenNotExists()
    {
        var execution = new WorkflowExecution { Id = 123, ExecutedAt = DateTime.UtcNow, WorkflowId = 1 };
        var updated = await _repository.UpdateAsync(execution);

        Assert.That(updated, Is.False);
    }

    [Test]
    public async Task DeleteAsync_DeletesExecution_WhenExists()
    {
        var workflow = new Workflow { Name = "Test" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var execution = new WorkflowExecution { ExecutedAt = DateTime.UtcNow, WorkflowId = workflow.Id };
        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync();

        var deleted = await _repository.DeleteAsync(execution.Id);

        Assert.That(deleted, Is.True);
        Assert.That(_context.WorkflowExecutions.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        var deleted = await _repository.DeleteAsync(999);
        Assert.That(deleted, Is.False);
    }
}