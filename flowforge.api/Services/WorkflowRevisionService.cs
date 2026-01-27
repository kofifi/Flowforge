using System.Globalization;
using System.Text.Json;
using Flowforge.Data;
using Flowforge.DTOs;
using Flowforge.Models;
using Flowforge.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Flowforge.Services;

public class WorkflowRevisionService : IWorkflowRevisionService
{
    private readonly IWorkflowRevisionRepository _repository;
    private readonly IWorkflowRepository _workflowRepository;
    private readonly FlowforgeDbContext _context;
    private readonly ISystemBlockService _systemBlockService;

    public WorkflowRevisionService(
        IWorkflowRevisionRepository repository,
        IWorkflowRepository workflowRepository,
        FlowforgeDbContext context,
        ISystemBlockService systemBlockService)
    {
        _repository = repository;
        _workflowRepository = workflowRepository;
        _context = context;
        _systemBlockService = systemBlockService;
    }

    public Task<IEnumerable<WorkflowRevision>> GetAllAsync() => _repository.GetAllAsync();

    public Task<IEnumerable<WorkflowRevision>> GetByWorkflowIdAsync(int workflowId)
        => _repository.GetByWorkflowIdAsync(workflowId);

    public Task<WorkflowRevision?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public async Task<WorkflowRevision> CreateAsync(WorkflowRevision revision)
    {
        revision.CreatedAt = DateTime.UtcNow;
        revision.IsActive = true;
        return await AddAndActivateAsync(revision);
    }

    public async Task<WorkflowRevision> CreateSnapshotAsync(int workflowId, string? label = null)
    {
        var workflow = await _context.Workflows
            .Include(w => w.Blocks).ThenInclude(b => b.SystemBlock)
            .Include(w => w.Blocks).ThenInclude(b => b.SourceConnections)
            .Include(w => w.WorkflowVariables)
            .FirstOrDefaultAsync(w => w.Id == workflowId);

        if (workflow == null)
            throw new InvalidOperationException($"Workflow {workflowId} not found.");

        var snapshot = BuildSnapshot(workflow);
        var version = await GetNextVersion(workflowId);
        var revision = new WorkflowRevision
        {
            WorkflowId = workflowId,
            Version = version,
            Label = string.IsNullOrWhiteSpace(label) ? version : label.Trim(),
            CreatedAt = DateTime.UtcNow,
            SnapshotJson = JsonSerializer.Serialize(snapshot),
            IsActive = true,
        };

        return await AddAndActivateAsync(revision);
    }

    public async Task<bool> UpdateAsync(int id, WorkflowRevision revision)
    {
        if (id != revision.Id)
            return false;
        return await _repository.UpdateAsync(revision);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);

    public Task<WorkflowRevision?> GetLatestByWorkflowIdAsync(int workflowId)
        => _repository.GetLatestByWorkflowIdAsync(workflowId);

    public async Task<bool> RestoreRevisionAsync(int workflowId, int revisionId)
    {
        var revision = await _repository.GetByIdAsync(revisionId);
        if (revision == null || revision.WorkflowId != workflowId)
            return false;

        var snapshot = JsonSerializer.Deserialize<WorkflowExportDto>(revision.SnapshotJson);
        if (snapshot == null)
            return false;

        await RebuildWorkflowFromSnapshot(workflowId, snapshot);
        await MarkActiveRevisionAsync(workflowId, revisionId);
        revision.AppliedAt = DateTime.UtcNow;
        await _repository.UpdateAsync(revision);
        return true;
    }

    private async Task<WorkflowRevision> AddAndActivateAsync(WorkflowRevision revision)
    {
        var created = await _repository.AddAsync(revision);
        await MarkActiveRevisionAsync(revision.WorkflowId, created.Id);
        return created;
    }

    private async Task<string> GetNextVersion(int workflowId)
    {
        var existing = await _repository.GetByWorkflowIdAsync(workflowId);
        var max = 0;

        foreach (var item in existing)
        {
            if (int.TryParse(item.Version.TrimStart('v', 'V'), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
            {
                max = Math.Max(max, parsed);
            }
        }

        return $"v{max + 1}";
    }

    private static WorkflowExportDto BuildSnapshot(Workflow workflow)
    {
        var blocks = workflow.Blocks
            .OrderBy(b => b.Id)
            .Select(b => new BlockExportDto
            {
                Id = b.Id,
                Name = b.Name,
                SystemBlockType = b.SystemBlock?.Type ?? string.Empty,
                JsonConfig = b.JsonConfig,
                PositionX = b.PositionX,
                PositionY = b.PositionY
            })
            .ToList();

        var connections = workflow.Blocks
            .SelectMany(b => b.SourceConnections)
            .Select(c => new BlockConnectionExportDto
            {
                SourceBlockId = c.SourceBlockId,
                TargetBlockId = c.TargetBlockId,
                ConnectionType = c.ConnectionType.ToString(),
                Label = c.Label
            })
            .ToList();

        var variables = workflow.WorkflowVariables
            .Select(v => new WorkflowVariableExportDto
            {
                Name = v.Name,
                DefaultValue = v.DefaultValue
            })
            .ToList();

        return new WorkflowExportDto
        {
            Name = workflow.Name,
            Blocks = blocks,
            Connections = connections,
            Variables = variables
        };
    }

    private async Task RebuildWorkflowFromSnapshot(int workflowId, WorkflowExportDto snapshot)
    {
        var existingBlocks = await _context.Blocks.Where(b => b.WorkflowId == workflowId).ToListAsync();
        var existingBlockIds = existingBlocks.Select(b => b.Id).ToList();

        var connections = await _context.BlockConnections
            .Where(c => existingBlockIds.Contains(c.SourceBlockId) || existingBlockIds.Contains(c.TargetBlockId))
            .ToListAsync();

        var variables = await _context.WorkflowVariables.Where(v => v.WorkflowId == workflowId).ToListAsync();

        _context.BlockConnections.RemoveRange(connections);
        _context.Blocks.RemoveRange(existingBlocks);
        _context.WorkflowVariables.RemoveRange(variables);
        await _context.SaveChangesAsync();

        var systemBlocks = await _systemBlockService.GetAllAsync();
        var typeMap = systemBlocks.ToDictionary(sb => sb.Type, sb => sb.Id, StringComparer.OrdinalIgnoreCase);
        var idMap = new Dictionary<int, int>();
        var index = 0;

        foreach (var blockDto in snapshot.Blocks)
        {
            if (!typeMap.TryGetValue(blockDto.SystemBlockType, out var systemBlockId))
                continue;

            var block = new Block
            {
                Name = string.IsNullOrWhiteSpace(blockDto.Name) ? blockDto.SystemBlockType : blockDto.Name,
                WorkflowId = workflowId,
                SystemBlockId = systemBlockId,
                JsonConfig = blockDto.JsonConfig,
                PositionX = blockDto.PositionX,
                PositionY = blockDto.PositionY
            };

            _context.Blocks.Add(block);
            await _context.SaveChangesAsync();
            var key = blockDto.Id != 0 ? blockDto.Id : ++index;
            idMap[key] = block.Id;
        }

        foreach (var variableDto in snapshot.Variables)
        {
            if (string.IsNullOrWhiteSpace(variableDto.Name))
                continue;

            _context.WorkflowVariables.Add(new WorkflowVariable
            {
                Name = variableDto.Name,
                DefaultValue = variableDto.DefaultValue,
                WorkflowId = workflowId
            });
        }

        await _context.SaveChangesAsync();

        foreach (var connectionDto in snapshot.Connections)
        {
            if (!idMap.TryGetValue(connectionDto.SourceBlockId, out var newSource) ||
                !idMap.TryGetValue(connectionDto.TargetBlockId, out var newTarget))
            {
                continue;
            }

            var connectionType = Enum.TryParse<ConnectionType>(connectionDto.ConnectionType, true, out var parsed)
                ? parsed
                : ConnectionType.Success;

            _context.BlockConnections.Add(new BlockConnection
            {
                SourceBlockId = newSource,
                TargetBlockId = newTarget,
                ConnectionType = connectionType,
                Label = connectionDto.Label
            });
        }

        await _context.SaveChangesAsync();
    }

    private async Task MarkActiveRevisionAsync(int workflowId, int revisionId)
    {
        var revisions = await _repository.GetByWorkflowIdAsync(workflowId);
        foreach (var revision in revisions)
        {
            revision.IsActive = revision.Id == revisionId;
        }

        await _context.SaveChangesAsync();

        var workflow = await _workflowRepository.GetByIdAsync(workflowId);
        if (workflow != null)
        {
            workflow.CurrentRevisionId = revisionId;
            await _workflowRepository.UpdateAsync(workflow);
        }
    }
}
