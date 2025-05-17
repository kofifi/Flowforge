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
    private WorkflowRevisionService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _repoMock = new Mock<IWorkflowRevisionRepository>();
        _service = new WorkflowRevisionService(_repoMock.Object);
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
}