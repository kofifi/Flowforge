using Flowforge.Models;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class IBlockServiceTests
{
    private Mock<IBlockService> _serviceMock;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IBlockService>();
    }

    [Test]
    public async Task GetAllAsync_ReturnsBlocks()
    {
        var blocks = new List<Block> { new Block { Id = 1, Name = "Test" } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(blocks);

        var result = await _serviceMock.Object.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Name, Is.EqualTo("Test"));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsBlock_WhenExists()
    {
        var block = new Block { Id = 1, Name = "Test" };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(block);

        var result = await _serviceMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(1));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(2)).ReturnsAsync((Block?)null);

        var result = await _serviceMock.Object.GetByIdAsync(2);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task CreateAsync_ReturnsBlock()
    {
        var block = new Block { Id = 1, Name = "Test" };
        _serviceMock.Setup(s => s.CreateAsync(block)).ReturnsAsync(block);

        var result = await _serviceMock.Object.CreateAsync(block);

        Assert.That(result, Is.EqualTo(block));
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var block = new Block { Id = 1, Name = "Test" };
        _serviceMock.Setup(s => s.UpdateAsync(1, block)).ReturnsAsync(true);

        var result = await _serviceMock.Object.UpdateAsync(1, block);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenFail()
    {
        var block = new Block { Id = 2, Name = "Test" };
        _serviceMock.Setup(s => s.UpdateAsync(2, block)).ReturnsAsync(false);

        var result = await _serviceMock.Object.UpdateAsync(2, block);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task DeleteAsync_ReturnsTrue_WhenSuccess()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _serviceMock.Object.DeleteAsync(1);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenFail()
    {
        _serviceMock.Setup(s => s.DeleteAsync(2)).ReturnsAsync(false);

        var result = await _serviceMock.Object.DeleteAsync(2);

        Assert.That(result, Is.False);
    }
}