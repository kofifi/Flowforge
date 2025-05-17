using Flowforge.Models;
using Flowforge.Repositories;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class IWorkflowExecutionRepositoryTests
{
    private Mock<IWorkflowExecutionRepository> _repoMock;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IWorkflowExecutionRepository>();
    }

    [Test]
    public async Task GetAllAsync_ReturnsExecutions()
    {
        var executions = new List<WorkflowExecution> { new WorkflowExecution { Id = 1 } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(executions);

        var result = await _repoMock.Object.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Id, Is.EqualTo(1));
        _repoMock.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsExecution_WhenExists()
    {
        var execution = new WorkflowExecution { Id = 1 };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(execution);

        var result = await _repoMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(execution));
        _repoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync((WorkflowExecution?)null);

        var result = await _repoMock.Object.GetByIdAsync(2);

        Assert.That(result, Is.Null);
        _repoMock.Verify(r => r.GetByIdAsync(2), Times.Once);
    }

    [Test]
    public async Task AddAsync_ReturnsExecution()
    {
        var execution = new WorkflowExecution { Id = 1 };
        _repoMock.Setup(r => r.AddAsync(execution)).ReturnsAsync(execution);

        var result = await _repoMock.Object.AddAsync(execution);

        Assert.That(result, Is.EqualTo(execution));
        _repoMock.Verify(r => r.AddAsync(execution), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var execution = new WorkflowExecution { Id = 1 };
        _repoMock.Setup(r => r.UpdateAsync(execution)).ReturnsAsync(true);

        var result = await _repoMock.Object.UpdateAsync(execution);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.UpdateAsync(execution), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenFail()
    {
        var execution = new WorkflowExecution { Id = 2 };
        _repoMock.Setup(r => r.UpdateAsync(execution)).ReturnsAsync(false);

        var result = await _repoMock.Object.UpdateAsync(execution);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.UpdateAsync(execution), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_ReturnsTrue_WhenSuccess()
    {
        _repoMock.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _repoMock.Object.DeleteAsync(1);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.DeleteAsync(1), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenFail()
    {
        _repoMock.Setup(r => r.DeleteAsync(2)).ReturnsAsync(false);

        var result = await _repoMock.Object.DeleteAsync(2);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.DeleteAsync(2), Times.Once);
    }
}