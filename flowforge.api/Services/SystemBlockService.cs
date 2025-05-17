using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public class SystemBlockService : ISystemBlockService
{
    private readonly ISystemBlockRepository _repository;

    public SystemBlockService(ISystemBlockRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<SystemBlock>> GetAllAsync()
        => await _repository.GetAllAsync();

    public async Task<SystemBlock?> GetByIdAsync(int id)
        => await _repository.GetByIdAsync(id);

    public async Task<SystemBlock> CreateAsync(SystemBlock systemBlock)
        => await _repository.AddAsync(systemBlock);

    public async Task<bool> UpdateAsync(int id, SystemBlock systemBlock)
    {
        if (id != systemBlock.Id)
            return false;
        return await _repository.UpdateAsync(systemBlock);
    }

    public async Task<bool> DeleteAsync(int id)
        => await _repository.DeleteAsync(id);
}