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
public class BlockServiceTests
{
    private Mock<IBlockRepository> _repoMock;
    private BlockService _service;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IBlockRepository>();
        _service = new BlockService(_repoMock.Object);
    }

    [Test]
    public async Task GetAllAsync_ReturnsBlocks()
    {
        var blocks = new List<Block> { new Block { Id = 1, Name = "Test" } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(blocks);

        var result = await _service.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Name, Is.EqualTo("Test"));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsBlock_WhenExists()
    {
        var block = new Block { Id = 1, Name = "Test" };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(block);

        var result = await _service.GetByIdAsync(1);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(1));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync((Block?)null);

        var result = await _service.GetByIdAsync(2);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task CreateAsync_ReturnsBlock()
    {
        var block = new Block { Id = 1, Name = "Test" };
        _repoMock.Setup(r => r.AddAsync(block)).ReturnsAsync(block);

        var result = await _service.CreateAsync(block);

        Assert.That(result, Is.EqualTo(block));
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var block = new Block { Id = 1, Name = "Test" };
        _repoMock.Setup(r => r.UpdateAsync(block)).ReturnsAsync(true);

        var result = await _service.UpdateAsync(1, block);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenIdMismatch()
    {
        var block = new Block { Id = 2, Name = "Test" };

        var result = await _service.UpdateAsync(1, block);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenRepositoryFails()
    {
        var block = new Block { Id = 1, Name = "Test" };
        _repoMock.Setup(r => r.UpdateAsync(block)).ReturnsAsync(false);

        var result = await _service.UpdateAsync(1, block);

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