using Flowforge.Models;
using Flowforge.Repositories;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class WorkflowRevisionServiceTests
{
    private Mock<IWorkflowRevisionRepository> _repoMock = null!;
    private Mock<IWorkflowRepository> _workflowRepoMock = null!;
    private WorkflowRevisionService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _repoMock = new Mock<IWorkflowRevisionRepository>();
        _workflowRepoMock = new Mock<IWorkflowRepository>();
        _service = new WorkflowRevisionService(_repoMock.Object, _workflowRepoMock.Object);
    }

    [Test]
    public async Task GetAllAsync_ReturnsAll()
    {
        var revisions = new List<WorkflowRevision> { new WorkflowRevision { Id = 1 } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(revisions);

        var result = await _service.GetAllAsync();

        Assert.That(result, Is.EqualTo(revisions));
        _repoMock.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsRevision()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(revision);

        var result = await _service.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(revision));
        _repoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((WorkflowRevision?)null);

        var result = await _service.GetByIdAsync(1);

        Assert.That(result, Is.Null);
        _repoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task CreateAsync_CallsAddAsync()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _repoMock.Setup(r => r.AddAsync(revision)).ReturnsAsync(revision);

        var result = await _service.CreateAsync(revision);

        Assert.That(result, Is.EqualTo(revision));
        _repoMock.Verify(r => r.AddAsync(revision), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenIdMismatch()
    {
        var revision = new WorkflowRevision { Id = 2 };
        var result = await _service.UpdateAsync(1, revision);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.UpdateAsync(It.IsAny<WorkflowRevision>()), Times.Never);
    }

    [Test]
    public async Task UpdateAsync_ReturnsResult_WhenIdMatches()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _repoMock.Setup(r => r.UpdateAsync(revision)).ReturnsAsync(true);

        var result = await _service.UpdateAsync(1, revision);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.UpdateAsync(revision), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_CallsDeleteAsync()
    {
        _repoMock.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _service.DeleteAsync(1);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.DeleteAsync(1), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        _repoMock.Setup(r => r.DeleteAsync(1)).ReturnsAsync(false);

        var result = await _service.DeleteAsync(1);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.DeleteAsync(1), Times.Once);
    }

    [Test]
    public async Task GetLatestByWorkflowIdAsync_ReturnsLatestRevision()
    {
        var revision = new WorkflowRevision { Id = 10, WorkflowId = 7 };
        _repoMock.Setup(r => r.GetLatestByWorkflowIdAsync(7)).ReturnsAsync(revision);

        var result = await _service.GetLatestByWorkflowIdAsync(7);

        Assert.That(result, Is.EqualTo(revision));
        _repoMock.Verify(r => r.GetLatestByWorkflowIdAsync(7), Times.Once);
    }

    [Test]
    public async Task GetLatestByWorkflowIdAsync_ReturnsNull_WhenNoRevision()
    {
        _repoMock.Setup(r => r.GetLatestByWorkflowIdAsync(7)).ReturnsAsync((WorkflowRevision?)null);

        var result = await _service.GetLatestByWorkflowIdAsync(7);

        Assert.That(result, Is.Null);
        _repoMock.Verify(r => r.GetLatestByWorkflowIdAsync(7), Times.Once);
    }

    [Test]
    public async Task RollbackToRevisionAsync_ReturnsFalse_WhenRevisionNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync((WorkflowRevision?)null);

        var result = await _service.RollbackToRevisionAsync(1, 5);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.GetByIdAsync(5), Times.Once);
        _workflowRepoMock.Verify(r => r.GetByIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task RollbackToRevisionAsync_ReturnsFalse_WhenWorkflowIdMismatch()
    {
        var revision = new WorkflowRevision { Id = 5, WorkflowId = 99 };
        _repoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(revision);

        var result = await _service.RollbackToRevisionAsync(1, 5);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.GetByIdAsync(5), Times.Once);
        _workflowRepoMock.Verify(r => r.GetByIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Test]
    public async Task RollbackToRevisionAsync_ReturnsFalse_WhenWorkflowNotFound()
    {
        var revision = new WorkflowRevision { Id = 5, WorkflowId = 1, Version = "v2" };
        _repoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(revision);
        _workflowRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Workflow?)null);

        var result = await _service.RollbackToRevisionAsync(1, 5);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.GetByIdAsync(5), Times.Once);
        _workflowRepoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task RollbackToRevisionAsync_UpdatesWorkflow_WhenAllValid()
    {
        var revision = new WorkflowRevision { Id = 5, WorkflowId = 1, Version = "v2" };
        var workflow = new Workflow { Id = 1, Name = "old" };
        _repoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(revision);
        _workflowRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(workflow);
        _workflowRepoMock.Setup(r => r.UpdateAsync(workflow)).Returns(Task.FromResult(true));

        var result = await _service.RollbackToRevisionAsync(1, 5);

        Assert.That(result, Is.True);
        Assert.That(workflow.Name, Is.EqualTo("v2"));
        _repoMock.Verify(r => r.GetByIdAsync(5), Times.Once);
        _workflowRepoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
        _workflowRepoMock.Verify(r => r.UpdateAsync(workflow), Times.Once);
    }

    [Test]
    public async Task RollbackToRevisionAsync_ReturnsFalse_WhenUpdateFails()
    {
        var revision = new WorkflowRevision { Id = 5, WorkflowId = 1, Version = "v2" };
        var workflow = new Workflow { Id = 1, Name = "old" };
        _repoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(revision);
        _workflowRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(workflow);
        _workflowRepoMock.Setup(r => r.UpdateAsync(workflow)).Returns(Task.FromResult(false));

        var result = await _service.RollbackToRevisionAsync(1, 5);

        Assert.That(result, Is.False);
        Assert.That(workflow.Name, Is.EqualTo("v2"));
        _repoMock.Verify(r => r.GetByIdAsync(5), Times.Once);
        _workflowRepoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
        _workflowRepoMock.Verify(r => r.UpdateAsync(workflow), Times.Once);
    }
}