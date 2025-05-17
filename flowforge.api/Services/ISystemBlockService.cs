using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public interface ISystemBlockService
{
    Task<IEnumerable<SystemBlock>> GetAllAsync();
    Task<SystemBlock?> GetByIdAsync(int id);
    Task<SystemBlock> CreateAsync(SystemBlock systemBlock);
    Task<bool> UpdateAsync(int id, SystemBlock systemBlock);
    Task<bool> DeleteAsync(int id);
}