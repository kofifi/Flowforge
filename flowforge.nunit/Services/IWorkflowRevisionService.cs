using Flowforge.Models;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class IWorkflowRevisionServiceTests
{
    private Mock<IWorkflowRevisionService> _serviceMock = null!;

    [SetUp]
    public void SetUp()
    {
        _serviceMock = new Mock<IWorkflowRevisionService>();
    }

    [Test]
    public async Task GetAllAsync_CalledOnce()
    {
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(new List<WorkflowRevision>());
        var result = await _serviceMock.Object.GetAllAsync();
        _serviceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_CalledWithCorrectId()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(5)).ReturnsAsync((WorkflowRevision?)null);
        var result = await _serviceMock.Object.GetByIdAsync(5);
        _serviceMock.Verify(s => s.GetByIdAsync(5), Times.Once);
    }

    [Test]
    public async Task CreateAsync_CalledWithCorrectRevision()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _serviceMock.Setup(s => s.CreateAsync(revision)).ReturnsAsync(revision);
        var result = await _serviceMock.Object.CreateAsync(revision);
        _serviceMock.Verify(s => s.CreateAsync(revision), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_CalledWithCorrectParams()
    {
        var revision = new WorkflowRevision { Id = 2 };
        _serviceMock.Setup(s => s.UpdateAsync(2, revision)).ReturnsAsync(true);
        var result = await _serviceMock.Object.UpdateAsync(2, revision);
        _serviceMock.Verify(s => s.UpdateAsync(2, revision), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_CalledWithCorrectId()
    {
        _serviceMock.Setup(s => s.DeleteAsync(3)).ReturnsAsync(true);
        var result = await _serviceMock.Object.DeleteAsync(3);
        _serviceMock.Verify(s => s.DeleteAsync(3), Times.Once);
    }

    [Test]
    public async Task GetLatestByWorkflowIdAsync_CalledWithCorrectWorkflowId()
    {
        var revision = new WorkflowRevision { Id = 10, WorkflowId = 7 };
        _serviceMock.Setup(s => s.GetLatestByWorkflowIdAsync(7)).ReturnsAsync(revision);
        var result = await _serviceMock.Object.GetLatestByWorkflowIdAsync(7);
        _serviceMock.Verify(s => s.GetLatestByWorkflowIdAsync(7), Times.Once);
        Assert.That(result, Is.EqualTo(revision));
    }
    
    [Test]
    public async Task RollbackToRevisionAsync_CalledWithCorrectParams()
    {
        _serviceMock.Setup(s => s.RollbackToRevisionAsync(1, 5)).ReturnsAsync(true);

        var result = await _serviceMock.Object.RollbackToRevisionAsync(1, 5);

        _serviceMock.Verify(s => s.RollbackToRevisionAsync(1, 5), Times.Once);
        Assert.That(result, Is.True);
    }
}