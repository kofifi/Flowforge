using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class SystemBlockRepositoryTests
{
    private FlowforgeDbContext _context;
    private SystemBlockRepository _repository;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(databaseName: "SystemBlockRepositoryTests")
            .Options;
        _context = new FlowforgeDbContext(options);
        _context.Database.EnsureDeleted();
        _context.Database.EnsureCreated();
        _context.SystemBlocks.RemoveRange(_context.SystemBlocks);
        _context.SaveChanges();
        _repository = new SystemBlockRepository(_context);
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    [Test]
    public async Task AddAsync_AddsSystemBlock()
    {
        var systemBlock = new SystemBlock { Type = "A", Description = "desc" };
        var result = await _repository.AddAsync(systemBlock);

        Assert.That(result.Id, Is.Not.EqualTo(0));
        Assert.That(_context.SystemBlocks.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetAllAsync_ReturnsAllSystemBlocks()
    {
        _context.SystemBlocks.Add(new SystemBlock { Type = "A" });
        _context.SystemBlocks.Add(new SystemBlock { Type = "B" });
        await _context.SaveChangesAsync();

        var blocks = await _repository.GetAllAsync();

        Assert.That(blocks.Count(), Is.EqualTo(2));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsSystemBlock_WhenExists()
    {
        var systemBlock = new SystemBlock { Type = "A" };
        _context.SystemBlocks.Add(systemBlock);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(systemBlock.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.Type, Is.EqualTo("A"));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        var result = await _repository.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateAsync_UpdatesSystemBlock_WhenExists()
    {
        var systemBlock = new SystemBlock { Type = "A" };
        _context.SystemBlocks.Add(systemBlock);
        await _context.SaveChangesAsync();

        systemBlock.Type = "B";
        var updated = await _repository.UpdateAsync(systemBlock);

        Assert.That(updated, Is.True);
        Assert.That(_context.SystemBlocks.First().Type, Is.EqualTo("B"));
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenNotExists()
    {
        var systemBlock = new SystemBlock { Id = 123, Type = "X" };
        var updated = await _repository.UpdateAsync(systemBlock);

        Assert.That(updated, Is.False);
    }

    [Test]
    public async Task DeleteAsync_DeletesSystemBlock_WhenExists()
    {
        var systemBlock = new SystemBlock { Type = "A" };
        _context.SystemBlocks.Add(systemBlock);
        await _context.SaveChangesAsync();

        var deleted = await _repository.DeleteAsync(systemBlock.Id);

        Assert.That(deleted, Is.True);
        Assert.That(_context.SystemBlocks.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        var deleted = await _repository.DeleteAsync(999);
        Assert.That(deleted, Is.False);
    }
}