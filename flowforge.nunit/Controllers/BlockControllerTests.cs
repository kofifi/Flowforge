using Flowforge.Controllers;
using Flowforge.Models;
using Flowforge.Repositories;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Controllers;

[TestFixture]
public class BlocksControllerTests
{
    private Mock<IBlockRepository> _repoMock;
    private BlocksController _controller;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IBlockRepository>();
        _controller = new BlocksController(_repoMock.Object);
    }

    [Test]
    public async Task GetAll_ReturnsOkWithBlocks()
    {
        var blocks = new List<Block> { new Block { Id = 1, Name = "A" } };
        _repoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(blocks);

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Is.EqualTo(blocks));
    }

    [Test]
    public async Task GetById_ReturnsOk_WhenBlockExists()
    {
        var block = new Block { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(block);

        var result = await _controller.GetById(1);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var ok = result.Result as OkObjectResult;
        Assert.That(ok!.Value, Is.EqualTo(block));
    }

    [Test]
    public async Task GetById_ReturnsNotFound_WhenBlockNotExists()
    {
        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Block?)null);

        var result = await _controller.GetById(1);

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var block = new Block { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.AddAsync(block)).ReturnsAsync(block);

        var result = await _controller.Create(block);

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = result.Result as CreatedAtActionResult;
        Assert.That(created!.Value, Is.EqualTo(block));
    }

    [Test]
    public async Task Update_ReturnsNoContent_WhenSuccess()
    {
        var block = new Block { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.UpdateAsync(block)).ReturnsAsync(true);

        var result = await _controller.Update(1, block);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task Update_ReturnsBadRequest_WhenIdMismatch()
    {
        var block = new Block { Id = 2, Name = "A" };

        var result = await _controller.Update(1, block);

        Assert.That(result, Is.InstanceOf<BadRequestResult>());
    }

    [Test]
    public async Task Update_ReturnsNotFound_WhenUpdateFails()
    {
        var block = new Block { Id = 1, Name = "A" };
        _repoMock.Setup(r => r.UpdateAsync(block)).ReturnsAsync(false);

        var result = await _controller.Update(1, block);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Delete_ReturnsNoContent_WhenSuccess()
    {
        _repoMock.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _controller.Delete(1);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
    }

    [Test]
    public async Task Delete_ReturnsNotFound_WhenFails()
    {
        _repoMock.Setup(r => r.DeleteAsync(1)).ReturnsAsync(false);

        var result = await _controller.Delete(1);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }
}