using Flowforge.Models;
using Flowforge.Services;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class IBlockConnectionServiceTests
{
    private Mock<IBlockConnectionService> _serviceMock;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IBlockConnectionService>();
    }

    [Test]
    public async Task GetAllAsync_ReturnsConnections()
    {
        var connections = new List<BlockConnection> { new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(connections);

        var result = await _serviceMock.Object.GetAllAsync();

        Assert.That(result.Count(), Is.EqualTo(1));
        Assert.That(result.First().Id, Is.EqualTo(1));
        _serviceMock.Verify(s => s.GetAllAsync(), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsConnection_WhenExists()
    {
        var connection = new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(connection);

        var result = await _serviceMock.Object.GetByIdAsync(1);

        Assert.That(result, Is.EqualTo(connection));
        _serviceMock.Verify(s => s.GetByIdAsync(1), Times.Once);
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(2)).ReturnsAsync((BlockConnection?)null);

        var result = await _serviceMock.Object.GetByIdAsync(2);

        Assert.That(result, Is.Null);
        _serviceMock.Verify(s => s.GetByIdAsync(2), Times.Once);
    }

    [Test]
    public async Task CreateAsync_ReturnsConnection()
    {
        var connection = new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 };
        _serviceMock.Setup(s => s.CreateAsync(connection)).ReturnsAsync(connection);

        var result = await _serviceMock.Object.CreateAsync(connection);

        Assert.That(result, Is.EqualTo(connection));
        _serviceMock.Verify(s => s.CreateAsync(connection), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsTrue_WhenSuccess()
    {
        var connection = new BlockConnection { Id = 1, SourceBlockId = 1, TargetBlockId = 2 };
        _serviceMock.Setup(s => s.UpdateAsync(1, connection)).ReturnsAsync(true);

        var result = await _serviceMock.Object.UpdateAsync(1, connection);

        Assert.That(result, Is.True);
        _serviceMock.Verify(s => s.UpdateAsync(1, connection), Times.Once);
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenFail()
    {
        var connection = new BlockConnection { Id = 2, SourceBlockId = 1, TargetBlockId = 2 };
        _serviceMock.Setup(s => s.UpdateAsync(2, connection)).ReturnsAsync(false);

        var result = await _serviceMock.Object.UpdateAsync(2, connection);

        Assert.That(result, Is.False);
        _serviceMock.Verify(s => s.UpdateAsync(2, connection), Times.Once);
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