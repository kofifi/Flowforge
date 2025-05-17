using Flowforge.Models;
using Flowforge.Repositories;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class WorkflowExecutionServiceTests
{
    private Mock<IWorkflowExecutionRepository> _repoMock;
    private WorkflowExecutionService _service;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IWorkflowExecutionRepository>();
        _service = new WorkflowExecutionService(_repoMock.Object);
    }

    [Test]
    public async Task GetAllAsync_ReturnsExecutions()
    {
        var executions = new List<WorkflowExecution> { new WorkflowExecution { Id = 1, WorkflowId = 1 } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(executions);

        var result = await _service.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Id, Is.EqualTo(1));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsExecution_WhenExists()
    {
        var execution = new WorkflowExecution { Id = 1, WorkflowId = 1 };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(execution);

        var result = await _service.GetByIdAsync(1);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(1));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync((WorkflowExecution?)null);

        var result = await _service.GetByIdAsync(2);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task CreateAsync_ReturnsExecution()
    {
        var execution = new WorkflowExecution { Id = 1, WorkflowId = 1 };
        _repoMock.Setup(r => r.AddAsync(execution)).ReturnsAsync(execution);

        var result = await _service.CreateAsync(execution);

        Assert.That(result, Is.EqualTo(execution));
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var execution = new WorkflowExecution { Id = 1, WorkflowId = 1 };
        _repoMock.Setup(r => r.UpdateAsync(execution)).ReturnsAsync(true);

        var result = await _service.UpdateAsync(1, execution);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenIdMismatch()
    {
        var execution = new WorkflowExecution { Id = 2, WorkflowId = 1 };

        var result = await _service.UpdateAsync(1, execution);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenRepositoryFails()
    {
        var execution = new WorkflowExecution { Id = 1, WorkflowId = 1 };
        _repoMock.Setup(r => r.UpdateAsync(execution)).ReturnsAsync(false);

        var result = await _service.UpdateAsync(1, execution);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task DeleteAsync_ReturnsTrue_WhenSuccess()
    {
        _repoMock.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _service.DeleteAsync(1);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenFail()
    {
        _repoMock.Setup(r => r.DeleteAsync(2)).ReturnsAsync(false);

        var result = await _service.DeleteAsync(2);

        Assert.That(result, Is.False);
    }
}