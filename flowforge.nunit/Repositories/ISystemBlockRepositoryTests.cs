using Flowforge.Models;
using Flowforge.Repositories;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class ISystemBlockRepositoryTests
{
    private Mock<ISystemBlockRepository> _repoMock;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<ISystemBlockRepository>();
    }

    [Test]
    public async Task GetAllAsync_ReturnsSystemBlocks()
    {
        var blocks = new List<SystemBlock> { new SystemBlock { Id = 1, Type = "A" } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(blocks);

        var result = await _repoMock.Object.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Type, Is.EqualTo("A"));
        _repoMock.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsSystemBlock_WhenExists()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(block);

        var result = await _repoMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(block));
        _repoMock.Verify(r => r.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync((SystemBlock?)null);

        var result = await _repoMock.Object.GetByIdAsync(2);

        Assert.That(result, Is.Null);
        _repoMock.Verify(r => r.GetByIdAsync(2), Times.Once);
    }

    [Test]
    public async Task AddAsync_ReturnsSystemBlock()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _repoMock.Setup(r => r.AddAsync(block)).ReturnsAsync(block);

        var result = await _repoMock.Object.AddAsync(block);

        Assert.That(result, Is.EqualTo(block));
        _repoMock.Verify(r => r.AddAsync(block), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _repoMock.Setup(r => r.UpdateAsync(block)).ReturnsAsync(true);

        var result = await _repoMock.Object.UpdateAsync(block);

        Assert.That(result, Is.True);
        _repoMock.Verify(r => r.UpdateAsync(block), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenFail()
    {
        var block = new SystemBlock { Id = 2, Type = "A" };
        _repoMock.Setup(r => r.UpdateAsync(block)).ReturnsAsync(false);

        var result = await _repoMock.Object.UpdateAsync(block);

        Assert.That(result, Is.False);
        _repoMock.Verify(r => r.UpdateAsync(block), Times.Once);
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