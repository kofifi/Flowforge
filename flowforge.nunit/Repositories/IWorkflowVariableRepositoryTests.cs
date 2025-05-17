using Flowforge.Models;
using Flowforge.Repositories;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class IWorkflowVariableRepositoryTests
{
    private Mock<IWorkflowVariableRepository> _repoMock;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IWorkflowVariableRepository>();
    }

    [Test]
    public async Task GetAllAsync_ReturnsVariables()
    {
        var variables = new List<WorkflowVariable> { new WorkflowVariable { Id = 1, Name = "A" } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(variables);

        var result = await _repoMock.Object.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Name, Is.EqualTo("A"));
        _repoMock.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsVariable_WhenExists()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(variable);

        var result = await _repoMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(variable));
        _repoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync((WorkflowVariable?)null);

        var result = await _repoMock.Object.GetByIdAsync(2);

        Assert.That(result, Is.Null);
        _repoMock.Verify(r => r.GetByIdAsync(2), Times.Once);
    }

    [Test]
    public async Task AddAsync_ReturnsVariable()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.AddAsync(variable)).ReturnsAsync(variable);

        var result = await _repoMock.Object.AddAsync(variable);

        Assert.That(result, Is.EqualTo(variable));
        _repoMock.Verify(r => r.AddAsync(variable), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.UpdateAsync(variable)).ReturnsAsync(true);

        var result = await _repoMock.Object.UpdateAsync(variable);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.UpdateAsync(variable), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenFail()
    {
        var variable = new WorkflowVariable { Id = 2, Name = "A" };
        _repoMock.Setup(r => r.UpdateAsync(variable)).ReturnsAsync(false);

        var result = await _repoMock.Object.UpdateAsync(variable);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.UpdateAsync(variable), Times.Once);
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