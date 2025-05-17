using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public interface ISystemBlockRepository
{
    Task<IEnumerable<SystemBlock>> GetAllAsync();
    Task<SystemBlock?> GetByIdAsync(int id);
    Task<SystemBlock> AddAsync(SystemBlock systemBlock);
    Task<bool> UpdateAsync(SystemBlock systemBlock);
    Task<bool> DeleteAsync(int id);
}