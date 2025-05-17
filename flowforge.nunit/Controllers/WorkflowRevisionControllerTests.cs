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
public class WorkflowRevisionControllerTests
{
    private Mock<IWorkflowRevisionService> _serviceMock = null!;
    private WorkflowRevisionController _controller = null!;

    [SetUp]
    public void SetUp()
    {
        _serviceMock = new Mock<IWorkflowRevisionService>();
        _controller = new WorkflowRevisionController(_serviceMock.Object);
    }

    [Test]
    public async Task GetAll_ReturnsOkWithRevisions()
    {
        var revisions = new List<WorkflowRevision> { new WorkflowRevision { Id = 1 } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(revisions);

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Is.EqualTo(revisions));
    }

    [Test]
    public async Task GetById_ReturnsOk_WhenFound()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(revision);

        var result = await _controller.GetById(1);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Is.EqualTo(revision));
    }

    [Test]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync((WorkflowRevision?)null);

        var result = await _controller.GetById(1);

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _serviceMock.Setup(s => s.CreateAsync(revision)).ReturnsAsync(revision);

        var result = await _controller.Create(revision);

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = result.Result as CreatedAtActionResult;
        Assert.That(created!.Value, Is.EqualTo(revision));
    }

    [Test]
    public async Task Update_ReturnsBadRequest_WhenIdMismatch()
    {
        var revision = new WorkflowRevision { Id = 2 };

        var result = await _controller.Update(1, revision);

        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task Update_ReturnsNotFound_WhenNotExists()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _serviceMock.Setup(s => s.UpdateAsync(1, revision)).ReturnsAsync(false);

        var result = await _controller.Update(1, revision);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Update_ReturnsNoContent_WhenSuccess()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _serviceMock.Setup(s => s.UpdateAsync(1, revision)).ReturnsAsync(true);

        var result = await _controller.Update(1, revision);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
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