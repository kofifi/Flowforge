using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class BlockRepositoryTests
{
    private FlowforgeDbContext _context;
    private BlockRepository _repository;

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }
    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(databaseName: "BlockRepositoryTests")
            .Options;
        _context = new FlowforgeDbContext(options);
        _context.Database.EnsureDeleted();
        _context.Database.EnsureCreated();
        _repository = new BlockRepository(_context);
    }

    [Test]
    public async Task AddAsync_AddsBlock()
    {
        var block = new Block { Name = "Test", Workflow = new Workflow(), SystemBlock = new SystemBlock() };
        var result = await _repository.AddAsync(block);

        Assert.That(result.Id, Is.Not.EqualTo(0));
        Assert.That(_context.Blocks.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetAllAsync_ReturnsAllBlocks()
    {
        _context.Blocks.Add(new Block { Name = "A", Workflow = new Workflow(), SystemBlock = new SystemBlock() });
        _context.Blocks.Add(new Block { Name = "B", Workflow = new Workflow(), SystemBlock = new SystemBlock() });
        await _context.SaveChangesAsync();

        var blocks = await _repository.GetAllAsync();

        Assert.That(blocks.Count(), Is.EqualTo(2));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsBlock_WhenExists()
    {
        var block = new Block { Name = "A", Workflow = new Workflow(), SystemBlock = new SystemBlock() };
        _context.Blocks.Add(block);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(block.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Name, Is.EqualTo("A"));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        var result = await _repository.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateAsync_UpdatesBlock_WhenExists()
    {
        var block = new Block { Name = "A", Workflow = new Workflow(), SystemBlock = new SystemBlock() };
        _context.Blocks.Add(block);
        await _context.SaveChangesAsync();

        block.Name = "Updated";
        var updated = await _repository.UpdateAsync(block);

        Assert.That(updated, Is.True);
        Assert.That(_context.Blocks.First().Name, Is.EqualTo("Updated"));
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenNotExists()
    {
        var block = new Block { Id = 123, Name = "X", Workflow = new Workflow(), SystemBlock = new SystemBlock() };
        var updated = await _repository.UpdateAsync(block);

        Assert.That(updated, Is.False);
    }

    [Test]
    public async Task DeleteAsync_DeletesBlock_WhenExists()
    {
        var block = new Block { Name = "A", Workflow = new Workflow(), SystemBlock = new SystemBlock() };
        _context.Blocks.Add(block);
        await _context.SaveChangesAsync();

        var deleted = await _repository.DeleteAsync(block.Id);

        Assert.That(deleted, Is.True);
        Assert.That(_context.Blocks.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        var deleted = await _repository.DeleteAsync(999);
        Assert.That(deleted, Is.False);
    }
}