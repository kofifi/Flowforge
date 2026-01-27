using Flowforge.Controllers;
using Flowforge.DTOs;
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
        var revisions = new List<WorkflowRevision>
        {
            new WorkflowRevision { Id = 1, WorkflowId = 2, Version = "v1" }
        };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(revisions);

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Is.Not.Null);
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
    
    [Test]
    public async Task GetLatestByWorkflowId_ReturnsOk_WhenFound()
    {
        var revision = new WorkflowRevision { Id = 10, WorkflowId = 7 };
        _serviceMock.Setup(s => s.GetLatestByWorkflowIdAsync(7)).ReturnsAsync(revision);

        var result = await _controller.GetLatestByWorkflowId(7);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Is.EqualTo(revision));
    }

    [Test]
    public async Task GetLatestByWorkflowId_ReturnsNotFound_WhenMissing()
    {
        _serviceMock.Setup(s => s.GetLatestByWorkflowIdAsync(7)).ReturnsAsync((WorkflowRevision?)null);

        var result = await _controller.GetLatestByWorkflowId(7);

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }
    
    [Test]
    public async Task RestoreRevision_ReturnsNoContent_WhenSuccess()
    {
        var revision = new WorkflowRevision { Id = 5, WorkflowId = 1 };
        _serviceMock.Setup(s => s.GetByIdAsync(5)).ReturnsAsync(revision);
        _serviceMock.Setup(s => s.RestoreRevisionAsync(1, 5)).ReturnsAsync(true);

        var result = await _controller.Restore(5);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
        _serviceMock.Verify(s => s.RestoreRevisionAsync(1, 5), Times.Once);
    }

    [Test]
    public async Task RestoreRevision_ReturnsNotFound_WhenFails()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(5)).ReturnsAsync((WorkflowRevision?)null);

        var result = await _controller.Restore(5);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task CreateSnapshot_ReturnsCreated()
    {
        var revision = new WorkflowRevision { Id = 12, WorkflowId = 3, Version = "v1" };
        _serviceMock.Setup(s => s.CreateSnapshotAsync(3, null)).ReturnsAsync(revision);

        var result = await _controller.CreateSnapshot(3, new CreateWorkflowRevisionRequest { Label = null });

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
    }
}
