using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.Services;

public class BlockService : IBlockService
{
    private readonly IBlockRepository _repository;
    private readonly ISystemBlockRepository _systemBlockRepository;

    public BlockService(IBlockRepository repository, ISystemBlockRepository systemBlockRepository)
    {
        _repository = repository;
        _systemBlockRepository = systemBlockRepository;
    }

    public async Task<IEnumerable<Block>> GetAllAsync()
        => await _repository.GetAllAsync();

    public async Task<Block?> GetByIdAsync(int id)
        => await _repository.GetByIdAsync(id);

    public async Task<Block> CreateAsync(Block block)
    {
        var systemBlock = await _systemBlockRepository.GetByIdAsync(block.SystemBlockId);
        if (systemBlock != null && (systemBlock.Type == "Start" || systemBlock.Type == "End"))
        {
            var existingBlocks = await _repository.GetAllAsync();
            var existing = existingBlocks.FirstOrDefault(existingBlock =>
                existingBlock.WorkflowId == block.WorkflowId &&
                existingBlock.SystemBlockId == block.SystemBlockId);
            if (existing != null)
                return existing;
        }

        await EnsureSingleStartEndAsync(block, block.Id);
        return await _repository.AddAsync(block);
    }

    public async Task<bool> UpdateAsync(int id, Block block)
    {
        if (id != block.Id)
            return false;
        await EnsureSingleStartEndAsync(block, id);
        return await _repository.UpdateAsync(block);
    }

    public async Task<bool> DeleteAsync(int id)
        => await _repository.DeleteAsync(id);

    private async Task EnsureSingleStartEndAsync(Block block, int currentId)
    {
        var systemBlock = await _systemBlockRepository.GetByIdAsync(block.SystemBlockId);
        if (systemBlock == null)
            return;

        if (systemBlock.Type != "Start" && systemBlock.Type != "End")
            return;

        var allBlocks = await _repository.GetAllAsync();
        var hasDuplicate = allBlocks.Any(existing =>
            existing.WorkflowId == block.WorkflowId &&
            existing.SystemBlockId == block.SystemBlockId &&
            existing.Id != currentId);

        if (hasDuplicate)
            throw new InvalidOperationException($"Only one {systemBlock.Type} block is allowed per workflow.");
    }
}
