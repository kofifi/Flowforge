using Flowforge.Models;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class IWorkflowExecutionServiceTests
{
    private Mock<IWorkflowExecutionService> _serviceMock;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IWorkflowExecutionService>();
    }

    [Test]
    public async Task GetAllAsync_ReturnsExecutions()
    {
        var executions = new List<WorkflowExecution> { new WorkflowExecution { Id = 1, WorkflowId = 1 } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(executions);

        var result = await _serviceMock.Object.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Id, Is.EqualTo(1));
        _serviceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsExecution_WhenExists()
    {
        var execution = new WorkflowExecution { Id = 1, WorkflowId = 1 };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(execution);

        var result = await _serviceMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(execution));
        _serviceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(2)).ReturnsAsync((WorkflowExecution?)null);

        var result = await _serviceMock.Object.GetByIdAsync(2);

        Assert.That(result, Is.Null);
        _serviceMock.Verify(s => s.GetByIdAsync(2), Times.Once);
    }

    [Test]
    public async Task CreateAsync_ReturnsExecution()
    {
        var execution = new WorkflowExecution { Id = 1, WorkflowId = 1 };
        _serviceMock.Setup(s => s.CreateAsync(execution)).ReturnsAsync(execution);

        var result = await _serviceMock.Object.CreateAsync(execution);

        Assert.That(result, Is.EqualTo(execution));
        _serviceMock.Verify(s => s.CreateAsync(execution), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var execution = new WorkflowExecution { Id = 1, WorkflowId = 1 };
        _serviceMock.Setup(s => s.UpdateAsync(1, execution)).ReturnsAsync(true);

        var result = await _serviceMock.Object.UpdateAsync(1, execution);

        Assert.That(result, Is.True);
        _serviceMock.Verify(s => s.UpdateAsync(1, execution), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenFail()
    {
        var execution = new WorkflowExecution { Id = 2, WorkflowId = 1 };
        _serviceMock.Setup(s => s.UpdateAsync(2, execution)).ReturnsAsync(false);

        var result = await _serviceMock.Object.UpdateAsync(2, execution);

        Assert.That(result, Is.False);
        _serviceMock.Verify(s => s.UpdateAsync(2, execution), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_ReturnsTrue_WhenSuccess()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _serviceMock.Object.DeleteAsync(1);

        Assert.That(result, Is.True);
        _serviceMock.Verify(s => s.DeleteAsync(1), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenFail()
    {
        _serviceMock.Setup(s => s.DeleteAsync(2)).ReturnsAsync(false);

        var result = await _serviceMock.Object.DeleteAsync(2);

        Assert.That(result, Is.False);
        _serviceMock.Verify(s => s.DeleteAsync(2), Times.Once);
    }
}