using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

public class WorkflowRepositoryTests
{
    private FlowforgeDbContext _context;
    private WorkflowRepository _repository;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(System.Guid.NewGuid().ToString())
            .Options;
        _context = new FlowforgeDbContext(options);
        _repository = new WorkflowRepository(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task GetAllAsync_ReturnsEmpty_WhenNoWorkflows()
    {
        var result = await _repository.GetAllAsync();
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task AddAsync_AddsWorkflow()
    {
        var workflow = new Workflow { Name = "Test" };
        var created = await _repository.AddAsync(workflow);

        Assert.That(created.Id, Is.Not.EqualTo(0));
        Assert.That(_context.Workflows.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsWorkflow_WhenExists()
    {
        var workflow = new Workflow { Name = "Test" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(workflow.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(workflow.Id));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        var result = await _repository.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateAsync_UpdatesWorkflow_WhenExists()
    {
        var workflow = new Workflow { Name = "Old" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        workflow.Name = "New";
        var updated = await _repository.UpdateAsync(workflow);

        Assert.That(updated, Is.True);
        Assert.That(_context.Workflows.First().Name, Is.EqualTo("New"));
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenNotExists()
    {
        var workflow = new Workflow { Id = 123, Name = "Test" };
        var result = await _repository.UpdateAsync(workflow);
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task DeleteAsync_RemovesWorkflow_WhenExists()
    {
        var workflow = new Workflow { Name = "ToDelete" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var deleted = await _repository.DeleteAsync(workflow.Id);

        Assert.That(deleted, Is.True);
        Assert.That(_context.Workflows.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        var result = await _repository.DeleteAsync(123);
        Assert.That(result, Is.False);
    }
}