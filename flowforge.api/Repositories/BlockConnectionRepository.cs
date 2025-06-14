using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public class BlockConnectionRepository : IBlockConnectionRepository
{
    private readonly FlowforgeDbContext _context;

    public BlockConnectionRepository(FlowforgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BlockConnection>> GetAllAsync()
    {
        return await _context.BlockConnections
            .Include(bc => bc.SourceBlock)
            .Include(bc => bc.TargetBlock)
            .ToListAsync();
    }

    public async Task<BlockConnection?> GetByIdAsync(int id)
    {
        return await _context.BlockConnections
            .Include(bc => bc.SourceBlock)
            .Include(bc => bc.TargetBlock)
            .FirstOrDefaultAsync(bc => bc.Id == id);
    }

    public async Task<BlockConnection> AddAsync(BlockConnection connection)
    {
        if (connection.SourceBlock != null)
        {
            _context.Attach(connection.SourceBlock).State = EntityState.Unchanged;
        }

        if (connection.TargetBlock != null)
        {
            _context.Attach(connection.TargetBlock).State = EntityState.Unchanged;
        }

        _context.BlockConnections.Add(connection);
        await _context.SaveChangesAsync();
        return connection;
    }

    public async Task<bool> UpdateAsync(BlockConnection connection)
    {
        if (!_context.BlockConnections.Any(bc => bc.Id == connection.Id))
            return false;
        _context.BlockConnections.Update(connection);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var connection = await _context.BlockConnections.FindAsync(id);
        if (connection == null)
            return false;
        _context.BlockConnections.Remove(connection);
        await _context.SaveChangesAsync();
        return true;
    }
}