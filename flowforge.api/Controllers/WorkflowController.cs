using Flowforge.Data;
using Flowforge.DTOs;
using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowController : ControllerBase
{
    private readonly IWorkflowService _service;
    private readonly FlowforgeDbContext _context;

    public WorkflowController(IWorkflowService service, FlowforgeDbContext context)
    {
        _service = service;
        _context = context;
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
