using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;

namespace Flowforge.Repositories;

public class BlockRepository : IBlockRepository
{
    private readonly FlowforgeDbContext _context;

    public BlockRepository(FlowforgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Block>> GetAllAsync()
    {
        return await _context.Blocks
            .Include(b => b.Workflow)
            .Include(b => b.SystemBlock)
            .Include(b => b.SourceConnections)
            .Include(b => b.TargetConnections)
            .ToListAsync();
    }

    public async Task<Block?> GetByIdAsync(int id)
    {
        return await _context.Blocks
            .Include(b => b.Workflow)
            .Include(b => b.SystemBlock)
            .Include(b => b.SourceConnections)
            .Include(b => b.TargetConnections)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Block> AddAsync(Block block)
    {
        _context.Blocks.Add(block);
        await _context.SaveChangesAsync();
        return block;
    }

    public async Task<bool> UpdateAsync(Block block)
    {
        if (!_context.Blocks.Any(b => b.Id == block.Id))
            return false;

        _context.Blocks.Update(block);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var block = await _context.Blocks.FindAsync(id);
        if (block == null)
            return false;

        _context.Blocks.Remove(block);
        await _context.SaveChangesAsync();
        return true;
    }
}