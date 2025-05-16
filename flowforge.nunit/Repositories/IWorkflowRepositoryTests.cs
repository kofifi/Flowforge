using Flowforge.Models;
using Flowforge.Repositories;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

public class IWorkflowRepositoryTests
{
    private Mock<IWorkflowRepository> _repoMock;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IWorkflowRepository>();
    }

    [Test]
    public async Task GetAllAsync_CalledOnce()
    {
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Workflow>());
        var result = await _repoMock.Object.GetAllAsync();
        Assert.That(result, Is.Empty);
        _repoMock.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_CalledWithId()
    {
        var workflow = new Workflow { Id = 1, Name = "Test" };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(workflow);

        var result = await _repoMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(workflow));
        _repoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task AddAsync_CalledWithWorkflow()
    {
        var workflow = new Workflow { Name = "Test" };
        _repoMock.Setup(r => r.AddAsync(workflow)).ReturnsAsync(workflow);

        var result = await _repoMock.Object.AddAsync(workflow);

        Assert.That(result, Is.EqualTo(workflow));
        _repoMock.Verify(r => r.AddAsync(workflow), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_CalledWithWorkflow()
    {
        var workflow = new Workflow { Id = 2, Name = "Update" };
        _repoMock.Setup(r => r.UpdateAsync(workflow)).ReturnsAsync(true);

        var result = await _repoMock.Object.UpdateAsync(workflow);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.UpdateAsync(workflow), Times.Once);
    }

    [Test]
    public async Task DeleteAsync_CalledWithId()
    {
        _repoMock.Setup(r => r.DeleteAsync(3)).ReturnsAsync(true);

        var result = await _repoMock.Object.DeleteAsync(3);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.DeleteAsync(3), Times.Once);
    }
}