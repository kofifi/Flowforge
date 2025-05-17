using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public class SystemBlockRepository : ISystemBlockRepository
{
    private readonly FlowforgeDbContext _context;

    public SystemBlockRepository(FlowforgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SystemBlock>> GetAllAsync()
    {
        return await _context.SystemBlocks
            .Include(sb => sb.Blocks)
            .ToListAsync();
    }

    public async Task<SystemBlock?> GetByIdAsync(int id)
    {
        return await _context.SystemBlocks
            .Include(sb => sb.Blocks)
            .FirstOrDefaultAsync(sb => sb.Id == id);
    }

    public async Task<SystemBlock> AddAsync(SystemBlock systemBlock)
    {
        _context.SystemBlocks.Add(systemBlock);
        await _context.SaveChangesAsync();
        return systemBlock;
    }

    public async Task<bool> UpdateAsync(SystemBlock systemBlock)
    {
        if (!_context.SystemBlocks.Any(sb => sb.Id == systemBlock.Id))
            return false;
        _context.SystemBlocks.Update(systemBlock);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var systemBlock = await _context.SystemBlocks.FindAsync(id);
        if (systemBlock == null)
            return false;
        _context.SystemBlocks.Remove(systemBlock);
        await _context.SaveChangesAsync();
        return true;
    }
}