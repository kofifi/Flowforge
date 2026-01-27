using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Flowforge.Services;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

public class WorkflowServiceTests
{
    private FlowforgeDbContext _context;
    private IWorkflowRepository _repository;
    private IBlockRepository _blockRepository;
    private ISystemBlockRepository _systemBlockRepository;
    private IBlockConnectionRepository _blockConnectionRepository;
    private WorkflowService _service;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(System.Guid.NewGuid().ToString())
            .Options;
        _context = new FlowforgeDbContext(options);
        _context.Database.EnsureCreated();
        _repository = new WorkflowRepository(_context);
        _blockRepository = new BlockRepository(_context);
        _systemBlockRepository = new SystemBlockRepository(_context);
        _blockConnectionRepository = new BlockConnectionRepository(_context);
        _service = new WorkflowService(_repository, _blockRepository, _systemBlockRepository, _blockConnectionRepository);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task GetAllAsync_ReturnsEmpty_WhenNoWorkflows()
    {
        var result = await _service.GetAllAsync();
        Assert.That(result, Is.Empty);
    }

    [Test]
    public async Task CreateAsync_AddsWorkflow()
    {
        var workflow = new Workflow { Name = "Test" };
        var created = await _service.CreateAsync(workflow);

        Assert.That(created.Id, Is.Not.EqualTo(0));
        Assert.That(_context.Workflows.Count(), Is.EqualTo(1));
        var blocks = _context.Blocks.Where(b => b.WorkflowId == created.Id).ToList();
        Assert.That(blocks.Count, Is.EqualTo(2));
        Assert.That(blocks.Select(b => b.Name), Is.EquivalentTo(new[] { "Start", "End" }));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsWorkflow_WhenExists()
    {
        var workflow = new Workflow { Name = "Test" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(workflow.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(workflow.Id));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        var result = await _service.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateAsync_UpdatesWorkflow_WhenIdsMatch()
    {
        var workflow = new Workflow { Name = "Old" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        workflow.Name = "New";
        var updated = await _service.UpdateAsync(workflow.Id, workflow);

        Assert.That(updated, Is.True);
        Assert.That(_context.Workflows.First().Name, Is.EqualTo("New"));
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenIdsDiffer()
    {
        var workflow = new Workflow { Id = 1, Name = "Test" };
        var result = await _service.UpdateAsync(2, workflow);
        Assert.That(result, Is.False);
    }

    [Test]
    public async Task DeleteAsync_RemovesWorkflow_WhenExists()
    {
        var workflow = new Workflow { Name = "ToDelete" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var deleted = await _service.DeleteAsync(workflow.Id);

        Assert.That(deleted, Is.True);
        Assert.That(_context.Workflows.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        var result = await _service.DeleteAsync(123);
        Assert.That(result, Is.False);
    }
}
