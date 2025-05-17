using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public interface IBlockConnectionRepository
{
    Task<IEnumerable<BlockConnection>> GetAllAsync();
    Task<BlockConnection?> GetByIdAsync(int id);
    Task<BlockConnection> AddAsync(BlockConnection connection);
    Task<bool> UpdateAsync(BlockConnection connection);
    Task<bool> DeleteAsync(int id);
}