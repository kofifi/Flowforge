using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public interface IBlockService
{
    Task<IEnumerable<Block>> GetAllAsync();
    Task<Block?> GetByIdAsync(int id);
    Task<Block> CreateAsync(Block block);
    Task<bool> UpdateAsync(int id, Block block);
    Task<bool> DeleteAsync(int id);
}