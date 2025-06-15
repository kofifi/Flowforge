using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class WorkflowVariableRepositoryTests
{
    private FlowforgeDbContext _context;
    private WorkflowVariableRepository _repository;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(databaseName: "WorkflowVariableRepositoryTests")
            .Options;
        _context = new FlowforgeDbContext(options);
        _context.Database.EnsureDeleted();
        _context.Database.EnsureCreated();
        _repository = new WorkflowVariableRepository(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task AddAsync_AddsVariable()
    {
        var workflow = new Workflow { Name = "W" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var variable = new WorkflowVariable { Name = "Var", Type = WorkflowVariableType.String, WorkflowId = workflow.Id };
        var result = await _repository.AddAsync(variable);

        Assert.That(result.Id, Is.Not.EqualTo(0));
        Assert.That(_context.WorkflowVariables.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetAllAsync_ReturnsAllVariables()
    {
        var workflow = new Workflow { Name = "W" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        _context.WorkflowVariables.Add(new WorkflowVariable { Name = "A", Type = WorkflowVariableType.Number, WorkflowId = workflow.Id });
        _context.WorkflowVariables.Add(new WorkflowVariable { Name = "B", Type = WorkflowVariableType.String, WorkflowId = workflow.Id });
        await _context.SaveChangesAsync();

        var variables = await _repository.GetAllAsync();

        Assert.That(variables.Count(), Is.EqualTo(2));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsVariable_WhenExists()
    {
        var workflow = new Workflow { Name = "W" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var variable = new WorkflowVariable { Name = "A", Type = WorkflowVariableType.Number, WorkflowId = workflow.Id };
        _context.WorkflowVariables.Add(variable);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(variable.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Name, Is.EqualTo("A"));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        var result = await _repository.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateAsync_UpdatesVariable_WhenExists()
    {
        var workflow = new Workflow { Name = "W" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var variable = new WorkflowVariable { Name = "A", Type = WorkflowVariableType.Number, WorkflowId = workflow.Id };
        _context.WorkflowVariables.Add(variable);
        await _context.SaveChangesAsync();

        variable.Name = "Updated";
        var updated = await _repository.UpdateAsync(variable);

        Assert.That(updated, Is.True);
        Assert.That(_context.WorkflowVariables.First().Name, Is.EqualTo("Updated"));
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenNotExists()
    {
        var variable = new WorkflowVariable { Id = 123, Name = "X", Type = WorkflowVariableType.Number, WorkflowId = 1 };
        var updated = await _repository.UpdateAsync(variable);

        Assert.That(updated, Is.False);
    }

    [Test]
    public async Task DeleteAsync_DeletesVariable_WhenExists()
    {
        var workflow = new Workflow { Name = "W" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var variable = new WorkflowVariable { Name = "A", Type = WorkflowVariableType.Number, WorkflowId = workflow.Id };
        _context.WorkflowVariables.Add(variable);
        await _context.SaveChangesAsync();

        var deleted = await _repository.DeleteAsync(variable.Id);

        Assert.That(deleted, Is.True);
        Assert.That(_context.WorkflowVariables.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        var deleted = await _repository.DeleteAsync(999);
        Assert.That(deleted, Is.False);
    }
}