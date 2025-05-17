using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Repositories;

[TestFixture]
public class BlockConnectionRepositoryTests
{
    private FlowforgeDbContext _context;
    private BlockConnectionRepository _repository;

    [SetUp]
    public void Setup()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(databaseName: "BlockConnectionRepositoryTests")
            .Options;
        _context = new FlowforgeDbContext(options);
        _context.Database.EnsureDeleted();
        _context.Database.EnsureCreated();
        _repository = new BlockConnectionRepository(_context);
    }

    [TearDown]
    public void TearDown()
    {
        _context.Dispose();
    }

    [Test]
    public async Task AddAsync_AddsConnection()
    {
        var source = new Block { Name = "Source" };
        var target = new Block { Name = "Target" };
        _context.Blocks.AddRange(source, target);
        await _context.SaveChangesAsync();

        var connection = new BlockConnection { SourceBlockId = source.Id, TargetBlockId = target.Id };
        var result = await _repository.AddAsync(connection);

        Assert.That(result.Id, Is.Not.EqualTo(0));
        Assert.That(_context.BlockConnections.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetAllAsync_ReturnsAllConnections()
    {
        var source = new Block { Name = "S" };
        var target = new Block { Name = "T" };
        _context.Blocks.AddRange(source, target);
        await _context.SaveChangesAsync();

        _context.BlockConnections.Add(new BlockConnection { SourceBlockId = source.Id, TargetBlockId = target.Id });
        _context.BlockConnections.Add(new BlockConnection { SourceBlockId = target.Id, TargetBlockId = source.Id });
        await _context.SaveChangesAsync();

        var connections = await _repository.GetAllAsync();

        Assert.That(connections.Count(), Is.EqualTo(2));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsConnection_WhenExists()
    {
        var source = new Block { Name = "S" };
        var target = new Block { Name = "T" };
        _context.Blocks.AddRange(source, target);
        await _context.SaveChangesAsync();

        var connection = new BlockConnection { SourceBlockId = source.Id, TargetBlockId = target.Id };
        _context.BlockConnections.Add(connection);
        await _context.SaveChangesAsync();

        var result = await _repository.GetByIdAsync(connection.Id);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.SourceBlockId, Is.EqualTo(source.Id));
    }

    [Test]
    public async Task GetByIdAsync_ReturnsNull_WhenNotExists()
    {
        var result = await _repository.GetByIdAsync(999);
        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task UpdateAsync_UpdatesConnection_WhenExists()
    {
        var source = new Block { Name = "S" };
        var target = new Block { Name = "T" };
        _context.Blocks.AddRange(source, target);
        await _context.SaveChangesAsync();

        var connection = new BlockConnection { SourceBlockId = source.Id, TargetBlockId = target.Id };
        _context.BlockConnections.Add(connection);
        await _context.SaveChangesAsync();

        connection.TargetBlockId = source.Id;
        var updated = await _repository.UpdateAsync(connection);

        Assert.That(updated, Is.True);
        Assert.That(_context.BlockConnections.First().TargetBlockId, Is.EqualTo(source.Id));
    }

    [Test]
    public async Task UpdateAsync_ReturnsFalse_WhenNotExists()
    {
        var connection = new BlockConnection { Id = 123, SourceBlockId = 1, TargetBlockId = 2 };
        var updated = await _repository.UpdateAsync(connection);

        Assert.That(updated, Is.False);
    }

    [Test]
    public async Task DeleteAsync_DeletesConnection_WhenExists()
    {
        var source = new Block { Name = "S" };
        var target = new Block { Name = "T" };
        _context.Blocks.AddRange(source, target);
        await _context.SaveChangesAsync();

        var connection = new BlockConnection { SourceBlockId = source.Id, TargetBlockId = target.Id };
        _context.BlockConnections.Add(connection);
        await _context.SaveChangesAsync();

        var deleted = await _repository.DeleteAsync(connection.Id);

        Assert.That(deleted, Is.True);
        Assert.That(_context.BlockConnections.Count(), Is.EqualTo(0));
    }

    [Test]
    public async Task DeleteAsync_ReturnsFalse_WhenNotExists()
    {
        var deleted = await _repository.DeleteAsync(999);
        Assert.That(deleted, Is.False);
    }
}