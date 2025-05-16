using Flowforge.Models;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

public class IWorkflowServiceTests
{
    private Mock<IWorkflowService> _serviceMock;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IWorkflowService>();
    }

    [Test]
    public async Task GetAllAsync_CalledOnce()
    {
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(new List<Workflow>());
        var result = await _serviceMock.Object.GetAllAsync();
        Assert.That(result, Is.Empty);
        _serviceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_CalledWithId()
    {
        var workflow = new Workflow { Id = 5, Name = "Test" };
        _serviceMock.Setup(s => s.GetByIdAsync(5)).ReturnsAsync(workflow);

        var result = await _serviceMock.Object.GetByIdAsync(5);

        Assert.That(result, Is.EqualTo(workflow));
        _serviceMock.Verify(s => s.GetByIdAsync(5), Times.Once);
    }

    [Test]
    public async Task CreateAsync_CalledWithWorkflow()
    {
        var workflow = new Workflow { Name = "Test" };
        _serviceMock.Setup(s => s.CreateAsync(workflow)).ReturnsAsync(workflow);

        var result = await _serviceMock.Object.CreateAsync(workflow);

        Assert.That(result, Is.EqualTo(workflow));
        _serviceMock.Verify(s => s.CreateAsync(workflow), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_CalledWithIdAndWorkflow()
    {
        var workflow = new Workflow { Id = 2, Name = "Update" };
        _serviceMock.Setup(s => s.UpdateAsync(2, workflow)).ReturnsAsync(true);

        var result = await _serviceMock.Object.UpdateAsync(2, workflow);

        Assert.That(result, Is.True);
        _serviceMock.Verify(s => s.UpdateAsync(2, workflow), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_CalledWithId()
    {
        _serviceMock.Setup(s => s.DeleteAsync(7)).ReturnsAsync(true);

        var result = await _serviceMock.Object.DeleteAsync(7);

        Assert.That(result, Is.True);
        _serviceMock.Verify(s => s.DeleteAsync(7), Times.Once);
    }
}