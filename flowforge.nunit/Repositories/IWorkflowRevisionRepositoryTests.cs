using Flowforge.Models;
using Flowforge.Repositories;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class IWorkflowRevisionRepositoryTests
{
    private Mock<IWorkflowRevisionRepository> _mock = null!;

    [SetUp]
    public void SetUp()
    {
        _mock = new Mock<IWorkflowRevisionRepository>();
    }

    [Test]
    public async Task GetAllAsync_CalledOnce()
    {
        _mock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<WorkflowRevision>());
        var result = await _mock.Object.GetAllAsync();
        _mock.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_CalledWithCorrectId()
    {
        _mock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync((WorkflowRevision?)null);
        var result = await _mock.Object.GetByIdAsync(5);
        _mock.Verify(r => r.GetByIdAsync(5), Times.Once);
    }

    [Test]
    public async Task AddAsync_CalledWithCorrectRevision()
    {
        var revision = new WorkflowRevision { Id = 1 };
        _mock.Setup(r => r.AddAsync(revision)).ReturnsAsync(revision);
        var result = await _mock.Object.AddAsync(revision);
        _mock.Verify(r => r.AddAsync(revision), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_CalledWithCorrectRevision()
    {
        var revision = new WorkflowRevision { Id = 2 };
        _mock.Setup(r => r.UpdateAsync(revision)).ReturnsAsync(true);
        var result = await _mock.Object.UpdateAsync(revision);
        _mock.Verify(r => r.UpdateAsync(revision), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_CalledWithCorrectId()
    {
        _mock.Setup(r => r.DeleteAsync(3)).ReturnsAsync(true);
        var result = await _mock.Object.DeleteAsync(3);
        _mock.Verify(r => r.DeleteAsync(3), Times.Once);
    }

    [Test]
    public async Task GetLatestByWorkflowIdAsync_CalledWithCorrectWorkflowId()
    {
        var revision = new WorkflowRevision { Id = 10, WorkflowId = 7 };
        _mock.Setup(r => r.GetLatestByWorkflowIdAsync(7)).ReturnsAsync(revision);
        var result = await _mock.Object.GetLatestByWorkflowIdAsync(7);
        _mock.Verify(r => r.GetLatestByWorkflowIdAsync(7), Times.Once);
        Assert.That(result, Is.EqualTo(revision));
    }
}