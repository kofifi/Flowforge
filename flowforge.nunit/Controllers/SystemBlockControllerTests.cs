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
public class SystemBlockControllerTests
{
    private Mock<ISystemBlockService> _serviceMock;
    private SystemBlockController _controller;

    [SetUp]
    public void Setup()
    {
        _serviceMock = new Mock<ISystemBlockService>();
        _controller = new SystemBlockController(_serviceMock.Object);
    }

    [Test]
    public async Task GetAll_ReturnsOkWithBlocks()
    {
        var blocks = new List<SystemBlock> { new SystemBlock { Id = 1, Type = "A" } };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(blocks);

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
    }

    [Test]
    public async Task GetById_ReturnsOk_WhenExists()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(block);

        var result = await _controller.GetById(1);

        Assert.That(result.Result, Is.TypeOf<OkObjectResult>());
    }

    [Test]
    public async Task GetById_ReturnsNotFound_WhenNotExists()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(2)).ReturnsAsync((SystemBlock?)null);

        var result = await _controller.GetById(2);

        Assert.That(result.Result, Is.TypeOf<NotFoundResult>());
    }

    [Test]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _serviceMock.Setup(s => s.CreateAsync(block)).ReturnsAsync(block);

        var result = await _controller.Create(block);

        Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
    }

    [Test]
    public async Task Update_ReturnsNoContent_WhenSuccess()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _serviceMock.Setup(s => s.UpdateAsync(1, block)).ReturnsAsync(true);

        var result = await _controller.Update(1, block);

        Assert.That(result, Is.TypeOf<NoContentResult>());
    }

    [Test]
    public async Task Update_ReturnsBadRequest_WhenIdMismatch()
    {
        var block = new SystemBlock { Id = 2, Type = "A" };

        var result = await _controller.Update(1, block);

        Assert.That(result, Is.TypeOf<BadRequestResult>());
    }

    [Test]
    public async Task Update_ReturnsNotFound_WhenNotExists()
    {
        var block = new SystemBlock { Id = 1, Type = "A" };
        _serviceMock.Setup(s => s.UpdateAsync(1, block)).ReturnsAsync(false);

        var result = await _controller.Update(1, block);

        Assert.That(result, Is.TypeOf<NotFoundResult>());
    }

    [Test]
    public async Task Delete_ReturnsNoContent_WhenSuccess()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _controller.Delete(1);

        Assert.That(result, Is.TypeOf<NoContentResult>());
    }

    [Test]
    public async Task Delete_ReturnsNotFound_WhenFail()
    {
        _serviceMock.Setup(s => s.DeleteAsync(2)).ReturnsAsync(false);

        var result = await _controller.Delete(2);

        Assert.That(result, Is.TypeOf<NotFoundResult>());
    }
}