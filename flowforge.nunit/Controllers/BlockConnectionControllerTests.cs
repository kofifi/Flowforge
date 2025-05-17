using Flowforge.Controllers;
using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Controllers;

[TestFixture]
public class BlockConnectionControllerTests
{
    private Mock<IBlockConnectionService> _serviceMock;
    private BlockConnectionController _controller;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<IBlockConnectionService>();
        _controller = new BlockConnectionController(_serviceMock.Object);
    }

    [Test]
    public async Task GetAll_ReturnsOkWithConnections()
    {
        var connections = new List<BlockConnection> { new BlockConnection { Id = 1 } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(connections);

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = (OkObjectResult)result.Result!;
        Assert.That(ok.Value, Is.EqualTo(connections));
    }

    [Test]
    public async Task GetById_ReturnsOk_WhenFound()
    {
        var connection = new BlockConnection { Id = 1 };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(connection);

        var result = await _controller.GetById(1);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = (OkObjectResult)result.Result!;
        Assert.That(ok.Value, Is.EqualTo(connection));
    }

    [Test]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(2)).ReturnsAsync((BlockConnection?)null);

        var result = await _controller.GetById(2);

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var connection = new BlockConnection { Id = 1 };
        _serviceMock.Setup(s => s.CreateAsync(connection)).ReturnsAsync(connection);

        var result = await _controller.Create(connection);

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = (CreatedAtActionResult)result.Result!;
        Assert.That(created.Value, Is.EqualTo(connection));
    }

    [Test]
    public async Task Update_ReturnsNoContent_WhenSuccess()
    {
        var connection = new BlockConnection { Id = 1 };
        _serviceMock.Setup(s => s.UpdateAsync(1, connection)).ReturnsAsync(true);

        var result = await _controller.Update(1, connection);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task Update_ReturnsBadRequest_WhenIdMismatch()
    {
        var connection = new BlockConnection { Id = 2 };

        var result = await _controller.Update(1, connection);

        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task Update_ReturnsNotFound_WhenNotExists()
    {
        var connection = new BlockConnection { Id = 1 };
        _serviceMock.Setup(s => s.UpdateAsync(1, connection)).ReturnsAsync(false);

        var result = await _controller.Update(1, connection);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Delete_ReturnsNoContent_WhenSuccess()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _controller.Delete(1);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task Delete_ReturnsNotFound_WhenNotExists()
    {
        _serviceMock.Setup(s => s.DeleteAsync(2)).ReturnsAsync(false);

        var result = await _controller.Delete(2);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }
}