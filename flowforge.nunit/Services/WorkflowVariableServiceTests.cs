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
public class WorkflowVariableServiceTests
{
    private Mock<IWorkflowVariableRepository> _repoMock;
    private Mock<IWorkflowRepository> _workflowRepoMock;
    private WorkflowVariableService _service;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IWorkflowVariableRepository>();
        _workflowRepoMock = new Mock<IWorkflowRepository>();
        _service = new WorkflowVariableService(_repoMock.Object, _workflowRepoMock.Object);
    }

    [Test]
    public async Task GetAllAsync_ReturnsVariables()
    {
        var variables = new List<WorkflowVariable> { new WorkflowVariable { Id = 1, Name = "A" } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(variables);

        var result = await _service.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Name, Is.EqualTo("A"));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsVariable_WhenExists()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(variable);

        var result = await _service.GetByIdAsync(1);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(1));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync((WorkflowVariable?)null);

        var result = await _service.GetByIdAsync(2);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task CreateAsync_ReturnsVariable()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.AddAsync(variable)).ReturnsAsync(variable);

        var result = await _service.CreateAsync(variable);

        Assert.That(result, Is.EqualTo(variable));
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.UpdateAsync(variable)).ReturnsAsync(true);

        var result = await _service.UpdateAsync(1, variable);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenIdMismatch()
    {
        var variable = new WorkflowVariable { Id = 2, Name = "A" };

        var result = await _service.UpdateAsync(1, variable);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenRepositoryFails()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.UpdateAsync(variable)).ReturnsAsync(false);

        var result = await _service.UpdateAsync(1, variable);

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