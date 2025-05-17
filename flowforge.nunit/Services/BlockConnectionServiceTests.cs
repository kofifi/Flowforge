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
public class BlockConnectionServiceTests
{
    private Mock<IBlockConnectionRepository> _repoMock;
    private BlockConnectionService _service;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IBlockConnectionRepository>();
        _service = new BlockConnectionService(_repoMock.Object);
    }

    [Test]
    public async Task GetAllAsync_ReturnsConnections()
    {
        var connections = new List<BlockConnection> { new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(connections);

        var result = await _service.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Id, Is.EqualTo(1));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsConnection_WhenExists()
    {
        var connection = new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(connection);

        var result = await _service.GetByIdAsync(1);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Id, Is.EqualTo(1));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync((BlockConnection?)null);

        var result = await _service.GetByIdAsync(2);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task CreateAsync_ReturnsConnection()
    {
        var connection = new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 };
        _repoMock.Setup(r => r.AddAsync(connection)).ReturnsAsync(connection);

        var result = await _service.CreateAsync(connection);

        Assert.That(result, Is.EqualTo(connection));
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var connection = new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 };
        _repoMock.Setup(r => r.UpdateAsync(connection)).ReturnsAsync(true);

        var result = await _service.UpdateAsync(1, connection);

        Assert.That(result, Is.True);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenIdMismatch()
    {
        var connection = new BlockConnection { Id = 2, SourceBlockId = 1, TargetBlockId = 2 };

        var result = await _service.UpdateAsync(1, connection);

        Assert.That(result, Is.False);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenRepositoryFails()
    {
        var connection = new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 };
        _repoMock.Setup(r => r.UpdateAsync(connection)).ReturnsAsync(false);

        var result = await _service.UpdateAsync(1, connection);

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