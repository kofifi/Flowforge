using Flowforge.Data;
using Flowforge.DTOs;
using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
    public class WorkflowController : ControllerBase
    {
        private readonly IWorkflowService _service;
        private readonly FlowforgeDbContext _context;
        private readonly ISystemBlockService _systemBlockService;

        public WorkflowController(IWorkflowService service, FlowforgeDbContext context, ISystemBlockService systemBlockService)
        {
            _service = service;
            _context = context;
            _systemBlockService = systemBlockService;
        }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Workflow>>> GetWorkflows()
        => await _service.GetAllAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<Workflow>> GetWorkflow(int id)
    {
        var workflow = await _service.GetByIdAsync(id);
        if (workflow == null)
            return NotFound();
        return workflow;
    }

    [HttpGet("{id}/graph")]
        public async Task<ActionResult<WorkflowGraphDto>> GetWorkflowGraph(int id)
        {
            var workflow = await _context.Workflows.FirstOrDefaultAsync(w => w.Id == id);
            if (workflow == null)
                return NotFound();

        var blocks = await _context.Blocks
            .Include(b => b.SystemBlock)
            .Where(b => b.WorkflowId == id)
            .ToListAsync();

        var blockIds = blocks.Select(b => b.Id).ToList();

        var connections = await _context.BlockConnections
            .Where(c => blockIds.Contains(c.SourceBlockId) && blockIds.Contains(c.TargetBlockId))
            .ToListAsync();

        var dto = new WorkflowGraphDto
        {
            WorkflowId = workflow.Id,
            Name = workflow.Name,
            Blocks = blocks.Select(b => new BlockGraphDto
            {
                Id = b.Id,
                Name = b.Name,
                SystemBlockId = b.SystemBlockId,
                SystemBlockType = b.SystemBlock?.Type ?? string.Empty,
                JsonConfig = b.JsonConfig,
                PositionX = b.PositionX,
                PositionY = b.PositionY
            }).ToList(),
            Connections = connections.Select(c => new BlockConnectionDto
            {
                Id = c.Id,
                SourceBlockId = c.SourceBlockId,
                TargetBlockId = c.TargetBlockId,
                ConnectionType = c.ConnectionType.ToString(),
                Label = c.Label
            }).ToList()
        };

        return Ok(dto);
    }

    [HttpPost]
        public async Task<ActionResult<Workflow>> CreateWorkflow(Workflow workflow)
        {
            var created = await _service.CreateAsync(workflow);
            return CreatedAtAction(nameof(GetWorkflow), new { id = created.Id }, created);
        }

        [HttpGet("{id}/export")]
        public async Task<ActionResult<WorkflowExportDto>> ExportWorkflow(int id)
        {
            var workflow = await _context.Workflows
                .Include(w => w.Blocks)
                .ThenInclude(b => b.SystemBlock)
                .Include(w => w.Blocks)
                .ThenInclude(b => b.SourceConnections)
                .Include(w => w.Blocks)
                .ThenInclude(b => b.TargetConnections)
                .Include(w => w.WorkflowVariables)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workflow == null)
                return NotFound();

            var export = new WorkflowExportDto
            {
                Name = workflow.Name,
                Blocks = workflow.Blocks
                    .OrderBy(b => b.Id)
                    .Select(b => new BlockExportDto
                    {
                        Id = b.Id,
                        Name = b.Name,
                        SystemBlockType = b.SystemBlock?.Type ?? string.Empty,
                        JsonConfig = b.JsonConfig,
                        PositionX = b.PositionX,
                        PositionY = b.PositionY
                    }).ToList(),
                Connections = workflow.Blocks
                    .SelectMany(b => b.SourceConnections)
                    .Select(c => new BlockConnectionExportDto
                    {
                        SourceBlockId = c.SourceBlockId,
                        TargetBlockId = c.TargetBlockId,
                        ConnectionType = c.ConnectionType.ToString(),
                        Label = c.Label
                    }).ToList(),
                Variables = workflow.WorkflowVariables
                    .Select(v => new WorkflowVariableExportDto { Name = v.Name, DefaultValue = v.DefaultValue })
                    .ToList()
            };

            return Ok(export);
        }

        [HttpPost("import")]
        public async Task<ActionResult<Workflow>> ImportWorkflow([FromBody] WorkflowImportDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Invalid import payload.");
            }

            var systemBlocks = await _systemBlockService.GetAllAsync();
            var typeMap = systemBlocks.ToDictionary(sb => sb.Type, sb => sb.Id, StringComparer.OrdinalIgnoreCase);

            var newWorkflow = new Workflow { Name = dto.Name };
            _context.Workflows.Add(newWorkflow);
            await _context.SaveChangesAsync();

            var blockIdMap = new List<int>();
            var originalIdMap = new Dictionary<int, int>();
            foreach (var (blockDto, index) in dto.Blocks.Select((b, i) => (b, i)))
            {
                if (!typeMap.TryGetValue(blockDto.SystemBlockType, out var sysId))
                {
                    return BadRequest($"Unknown system block type: {blockDto.SystemBlockType}");
                }

                var block = new Block
                {
                    Name = string.IsNullOrWhiteSpace(blockDto.Name) ? blockDto.SystemBlockType : blockDto.Name,
                    WorkflowId = newWorkflow.Id,
                    SystemBlockId = sysId,
                    JsonConfig = blockDto.JsonConfig,
                    PositionX = blockDto.PositionX,
                    PositionY = blockDto.PositionY
                };
                _context.Blocks.Add(block);
                await _context.SaveChangesAsync();
                blockIdMap.Add(block.Id);
                var originalKey = blockDto.Id ?? blockDto.OriginalId ?? index;
                originalIdMap[originalKey] = block.Id;
            }

            foreach (var variableDto in dto.Variables)
            {
                if (string.IsNullOrWhiteSpace(variableDto.Name)) continue;
                _context.WorkflowVariables.Add(new WorkflowVariable
                {
                    Name = variableDto.Name,
                    DefaultValue = variableDto.DefaultValue,
                    WorkflowId = newWorkflow.Id
                });
            }
            await _context.SaveChangesAsync();

            foreach (var connDto in dto.Connections)
            {
                int? sourceId = null;
                int? targetId = null;

                if (connDto.SourceBlockId.HasValue && originalIdMap.TryGetValue(connDto.SourceBlockId.Value, out var mappedSource))
                {
                    sourceId = mappedSource;
                }
                else if (connDto.SourceIndex.HasValue && connDto.SourceIndex.Value >= 0 && connDto.SourceIndex.Value < blockIdMap.Count)
                {
                    sourceId = blockIdMap[connDto.SourceIndex.Value];
                }

                if (connDto.TargetBlockId.HasValue && originalIdMap.TryGetValue(connDto.TargetBlockId.Value, out var mappedTarget))
                {
                    targetId = mappedTarget;
                }
                else if (connDto.TargetIndex.HasValue && connDto.TargetIndex.Value >= 0 && connDto.TargetIndex.Value < blockIdMap.Count)
                {
                    targetId = blockIdMap[connDto.TargetIndex.Value];
                }

                if (sourceId == 0 || targetId == 0) continue;

                var connectionType = Enum.TryParse<ConnectionType>(connDto.ConnectionType, true, out var parsed)
                    ? parsed
                    : ConnectionType.Success;

                if (sourceId.HasValue && targetId.HasValue)
                {
                    _context.BlockConnections.Add(new BlockConnection
                    {
                        SourceBlockId = sourceId.Value,
                        TargetBlockId = targetId.Value,
                        ConnectionType = connectionType,
                        Label = connDto.Label
                    });
                }
            }
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetWorkflow), new { id = newWorkflow.Id }, newWorkflow);
        }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWorkflow(int id, Workflow workflow)
    {
        var updated = await _service.UpdateAsync(id, workflow);
        if (!updated)
            return BadRequest();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorkflow(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound();
        return NoContent();
    }
}
