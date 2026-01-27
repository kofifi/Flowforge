using Flowforge.Controllers;
using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Flowforge.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace Flowforge.NUnit.Controllers;

public class WorkflowControllerTests
{
    private FlowforgeDbContext _context;
    private IWorkflowRepository _repository;
    private IBlockRepository _blockRepository;
    private ISystemBlockRepository _systemBlockRepository;
    private IBlockConnectionRepository _blockConnectionRepository;
    private ISystemBlockService _systemBlockService;
    private WorkflowService _service;
    private WorkflowController _controller;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new FlowforgeDbContext(options);
        _context.Database.EnsureCreated();
        _repository = new WorkflowRepository(_context);
        _blockRepository = new BlockRepository(_context);
        _systemBlockRepository = new SystemBlockRepository(_context);
        _blockConnectionRepository = new BlockConnectionRepository(_context);
        _systemBlockService = new SystemBlockService(_systemBlockRepository);
        _service = new WorkflowService(_repository, _blockRepository, _systemBlockRepository, _blockConnectionRepository);
        _controller = new WorkflowController(_service, _context, _systemBlockService);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task GetWorkflows_ReturnsEmptyList_WhenNoWorkflows()
    {
        var result = await _controller.GetWorkflows();
        Assert.That(result.Value, Is.Not.Null);
        Assert.That(result.Value, Is.Empty);
    }

    [Test]
    public async Task CreateWorkflow_AddsWorkflow()
    {
        var workflow = new Workflow { Name = "Test" };
        var result = await _controller.CreateWorkflow(workflow);

        Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
        Assert.That(_context.Workflows.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetWorkflow_ReturnsWorkflow_WhenExists()
    {
        var workflow = new Workflow { Name = "Test" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var result = await _controller.GetWorkflow(workflow.Id);

        Assert.That(result.Value, Is.Not.Null);
        Assert.That(result.Value!.Id, Is.EqualTo(workflow.Id));
    }

    [Test]
    public async Task GetWorkflow_ReturnsNotFound_WhenNotExists()
    {
        var result = await _controller.GetWorkflow(999);
        Assert.That(result.Result, Is.TypeOf<NotFoundResult>());
    }

    [Test]
    public async Task UpdateWorkflow_UpdatesWorkflow_WhenIdsMatch()
    {
        var workflow = new Workflow { Name = "Old" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        workflow.Name = "New";
        var result = await _controller.UpdateWorkflow(workflow.Id, workflow);

        Assert.That(result, Is.TypeOf<NoContentResult>());
        Assert.That(_context.Workflows.First().Name, Is.EqualTo("New"));
    }

    [Test]
    public async Task UpdateWorkflow_ReturnsBadRequest_WhenIdsDiffer()
    {
        var workflow = new Workflow { Id = 1, Name = "Test" };
        var result = await _controller.UpdateWorkflow(2, workflow);
        Assert.That(result, Is.TypeOf<BadRequestResult>());
    }

    [Test]
    public async Task DeleteWorkflow_RemovesWorkflow_WhenExists()
    {
        var workflow = new Workflow { Name = "ToDelete" };
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteWorkflow(workflow.Id);

        Assert.That(result, Is.TypeOf<NoContentResult>());
        Assert.That(_context.Workflows.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteWorkflow_ReturnsNotFound_WhenNotExists()
    {
        var result = await _controller.DeleteWorkflow(123);
        Assert.That(result, Is.TypeOf<NotFoundResult>());
    }
}
