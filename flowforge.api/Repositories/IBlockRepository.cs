using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public interface IBlockRepository
{
    Task<IEnumerable<Block>> GetAllAsync();
    Task<Block?> GetByIdAsync(int id);
    Task<Block> AddAsync(Block block);
    Task<bool> UpdateAsync(Block block);
    Task<bool> DeleteAsync(int id);
}