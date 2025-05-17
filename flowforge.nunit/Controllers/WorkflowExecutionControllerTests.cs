using Flowforge.Controllers;
using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Controllers;

[TestFixture]
public class WorkflowExecutionControllerTests
{
    private Mock<IWorkflowExecutionService> _serviceMock;
    private WorkflowExecutionController _controller;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IWorkflowExecutionService>();
        _controller = new WorkflowExecutionController(_serviceMock.Object);
    }

    [Test]
    public async Task GetAll_ReturnsOkWithExecutions()
    {
        var executions = new List<WorkflowExecution> { new WorkflowExecution { Id = 1 } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(executions);

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = (OkObjectResult)result.Result!;
        Assert.That(ok.Value, Is.EqualTo(executions));
    }

    [Test]
    public async Task GetById_ReturnsOk_WhenFound()
    {
        var execution = new WorkflowExecution { Id = 1 };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(execution);

        var result = await _controller.GetById(1);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = (OkObjectResult)result.Result!;
        Assert.That(ok.Value, Is.EqualTo(execution));
    }

    [Test]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(2)).ReturnsAsync((WorkflowExecution?)null);

        var result = await _controller.GetById(2);

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var execution = new WorkflowExecution { Id = 1 };
        _serviceMock.Setup(s => s.CreateAsync(execution)).ReturnsAsync(execution);

        var result = await _controller.Create(execution);

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = (CreatedAtActionResult)result.Result!;
        Assert.That(created.Value, Is.EqualTo(execution));
    }

    [Test]
    public async Task Update_ReturnsNoContent_WhenSuccess()
    {
        var execution = new WorkflowExecution { Id = 1 };
        _serviceMock.Setup(s => s.UpdateAsync(1, execution)).ReturnsAsync(true);

        var result = await _controller.Update(1, execution);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task Update_ReturnsBadRequest_WhenIdMismatch()
    {
        var execution = new WorkflowExecution { Id = 2 };

        var result = await _controller.Update(1, execution);

        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task Update_ReturnsNotFound_WhenNotExists()
    {
        var execution = new WorkflowExecution { Id = 1 };
        _serviceMock.Setup(s => s.UpdateAsync(1, execution)).ReturnsAsync(false);

        var result = await _controller.Update(1, execution);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Delete_ReturnsNoContent_WhenSuccess()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _controller.Delete(1);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task Delete_ReturnsNotFound_WhenNotExists()
    {
        _serviceMock.Setup(s => s.DeleteAsync(2)).ReturnsAsync(false);

        var result = await _controller.Delete(2);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }
}