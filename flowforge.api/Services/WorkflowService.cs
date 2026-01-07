using Flowforge.Models;
using Flowforge.Repositories;
using System.Linq;

namespace Flowforge.Services;

public class WorkflowService : IWorkflowService
{
    private readonly IWorkflowRepository _repository;
    private readonly IBlockRepository _blockRepository;
    private readonly ISystemBlockRepository _systemBlockRepository;
    private readonly IBlockConnectionRepository _blockConnectionRepository;

    public WorkflowService(
        IWorkflowRepository repository,
        IBlockRepository blockRepository,
        ISystemBlockRepository systemBlockRepository,
        IBlockConnectionRepository blockConnectionRepository)
    {
        _repository = repository;
        _blockRepository = blockRepository;
        _systemBlockRepository = systemBlockRepository;
        _blockConnectionRepository = blockConnectionRepository;
    }

    public Task<List<Workflow>> GetAllAsync()
        => _repository.GetAllAsync();

    public Task<Workflow?> GetByIdAsync(int id)
        => _repository.GetByIdAsync(id);

    public async Task<Workflow> CreateAsync(Workflow workflow)
    {
        var created = await _repository.AddAsync(workflow);
        var systemBlocks = await _systemBlockRepository.GetAllAsync();
        var startBlock = systemBlocks.FirstOrDefault(block => block.Type == "Start");
        var endBlock = systemBlocks.FirstOrDefault(block => block.Type == "End");

        if (startBlock != null)
        {
            await _blockRepository.AddAsync(new Block
            {
                Name = "Start",
                WorkflowId = created.Id,
                SystemBlockId = startBlock.Id
            });
        }

        if (endBlock != null)
        {
            await _blockRepository.AddAsync(new Block
            {
                Name = "End",
                WorkflowId = created.Id,
                SystemBlockId = endBlock.Id
            });
        }

        return created;
    }

    public Task<bool> UpdateAsync(int id, Workflow workflow)
    {
        if (id != workflow.Id)
            return Task.FromResult(false);
        return _repository.UpdateAsync(workflow);
    }

    public Task<bool> DeleteAsync(int id)
        => DeleteWorkflowGraphAsync(id);

    private async Task<bool> DeleteWorkflowGraphAsync(int workflowId)
    {
        var blocks = await _blockRepository.GetAllAsync();
        var workflowBlockIds = blocks
            .Where(block => block.WorkflowId == workflowId)
            .Select(block => block.Id)
            .ToList();

        if (workflowBlockIds.Count > 0)
        {
            var connections = await _blockConnectionRepository.GetAllAsync();
            var workflowConnections = connections
                .Where(connection =>
                    workflowBlockIds.Contains(connection.SourceBlockId) ||
                    workflowBlockIds.Contains(connection.TargetBlockId))
                .ToList();

            foreach (var connection in workflowConnections)
            {
                await _blockConnectionRepository.DeleteAsync(connection.Id);
            }
        }

        return await _repository.DeleteAsync(workflowId);
    }
}
