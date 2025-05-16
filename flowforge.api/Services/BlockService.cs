using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public class BlockService
{
    private readonly IBlockRepository _repository;

    public BlockService(IBlockRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<Block>> GetAllAsync()
        => await _repository.GetAllAsync();

    public async Task<Block?> GetByIdAsync(int id)
        => await _repository.GetByIdAsync(id);

    public async Task<Block> CreateAsync(Block block)
        => await _repository.AddAsync(block);

    public async Task<bool> UpdateAsync(int id, Block block)
    {
        if (id != block.Id)
            return false;
        return await _repository.UpdateAsync(block);
    }

    public async Task<bool> DeleteAsync(int id)
        => await _repository.DeleteAsync(id);
}