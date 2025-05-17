using Flowforge.Models;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class ISystemBlockServiceTests
{
    private Mock<ISystemBlockService> _serviceMock;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<ISystemBlockService>();
    }

    [Test]
    public async Task GetAllAsync_ReturnsSystemBlocks()
    {
        var blocks = new List<SystemBlock> { new SystemBlock { Id = 1, Type = "A" } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(blocks);

        var result = await _serviceMock.Object.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Type, Is.EqualTo("A"));
        _serviceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsSystemBlock_WhenExists()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(block);

        var result = await _serviceMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(block));
        _serviceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(2)).ReturnsAsync((SystemBlock?)null);

        var result = await _serviceMock.Object.GetByIdAsync(2);

        Assert.That(result, Is.Null);
        _serviceMock.Verify(s => s.GetByIdAsync(2), Times.Once);
    }

    [Test]
    public async Task CreateAsync_ReturnsSystemBlock()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _serviceMock.Setup(s => s.CreateAsync(block)).ReturnsAsync(block);

        var result = await _serviceMock.Object.CreateAsync(block);

        Assert.That(result, Is.EqualTo(block));
        _serviceMock.Verify(s => s.CreateAsync(block), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _serviceMock.Setup(s => s.UpdateAsync(1, block)).ReturnsAsync(true);

        var result = await _serviceMock.Object.UpdateAsync(1, block);

        Assert.That(result, Is.True);
        _serviceMock.Verify(s => s.UpdateAsync(1, block), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenFail()
    {
        var block = new SystemBlock { Id = 2, Type = "A" };
        _serviceMock.Setup(s => s.UpdateAsync(2, block)).ReturnsAsync(false);

        var result = await _serviceMock.Object.UpdateAsync(2, block);

        Assert.That(result, Is.False);
        _serviceMock.Verify(s => s.UpdateAsync(2, block), Times.Once);
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