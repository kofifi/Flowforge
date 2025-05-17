using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public class BlockConnectionService : IBlockConnectionService
{
    private readonly IBlockConnectionRepository _repository;

    public BlockConnectionService(IBlockConnectionRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<BlockConnection>> GetAllAsync()
        => await _repository.GetAllAsync();

    public async Task<BlockConnection?> GetByIdAsync(int id)
        => await _repository.GetByIdAsync(id);

    public async Task<BlockConnection> CreateAsync(BlockConnection connection)
        => await _repository.AddAsync(connection);

    public async Task<bool> UpdateAsync(int id, BlockConnection connection)
    {
        if (id != connection.Id)
            return false;
        return await _repository.UpdateAsync(connection);
    }

    public async Task<bool> DeleteAsync(int id)
        => await _repository.DeleteAsync(id);
}