using Flowforge.Models;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class IWorkflowVariableServiceTests
{
    private Mock<IWorkflowVariableService> _serviceMock;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IWorkflowVariableService>();
    }

    [Test]
    public async Task GetAllAsync_ReturnsVariables()
    {
        var variables = new List<WorkflowVariable> { new WorkflowVariable { Id = 1, Name = "A" } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(variables);

        var result = await _serviceMock.Object.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Name, Is.EqualTo("A"));
        _serviceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsVariable_WhenExists()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(variable);

        var result = await _serviceMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(variable));
        _serviceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(2)).ReturnsAsync((WorkflowVariable?)null);

        var result = await _serviceMock.Object.GetByIdAsync(2);

        Assert.That(result, Is.Null);
        _serviceMock.Verify(s => s.GetByIdAsync(2), Times.Once);
    }

    [Test]
    public async Task CreateAsync_ReturnsVariable()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _serviceMock.Setup(s => s.CreateAsync(variable)).ReturnsAsync(variable);

        var result = await _serviceMock.Object.CreateAsync(variable);

        Assert.That(result, Is.EqualTo(variable));
        _serviceMock.Verify(s => s.CreateAsync(variable), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var variable = new WorkflowVariable { Id = 1, Name = "A" };
        _serviceMock.Setup(s => s.UpdateAsync(1, variable)).ReturnsAsync(true);

        var result = await _serviceMock.Object.UpdateAsync(1, variable);

        Assert.That(result, Is.True);
        _serviceMock.Verify(s => s.UpdateAsync(1, variable), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenFail()
    {
        var variable = new WorkflowVariable { Id = 2, Name = "A" };
        _serviceMock.Setup(s => s.UpdateAsync(2, variable)).ReturnsAsync(false);

        var result = await _serviceMock.Object.UpdateAsync(2, variable);

        Assert.That(result, Is.False);
        _serviceMock.Verify(s => s.UpdateAsync(2, variable), Times.Once);
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