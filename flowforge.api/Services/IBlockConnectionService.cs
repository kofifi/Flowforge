using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public interface IBlockConnectionService
{
    Task<IEnumerable<BlockConnection>> GetAllAsync();
    Task<BlockConnection?> GetByIdAsync(int id);
    Task<BlockConnection> CreateAsync(BlockConnection connection);
    Task<bool> UpdateAsync(int id, BlockConnection connection);
    Task<bool> DeleteAsync(int id);
}