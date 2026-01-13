using Flowforge.Models;
using Flowforge.Services;
using Flowforge.Data;
using Flowforge.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowExecutionController : ControllerBase
{
    private readonly IWorkflowExecutionService _service;
    private readonly FlowforgeDbContext _context;

    public WorkflowExecutionController(IWorkflowExecutionService service, FlowforgeDbContext context)
    {
        _service = service;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkflowExecutionDto>>> GetAll()
    {
        var executions = await _service.GetAllAsync();
        var dto = executions.Select(MapToDto).ToList();
        return Ok(dto);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkflowExecutionDto>> GetById(int id)
    {
        var execution = await _service.GetByIdAsync(id);
        if (execution == null)
            return NotFound();
        return Ok(MapToDto(execution));
    }

    [HttpPost]
    public async Task<ActionResult<WorkflowExecution>> Create(WorkflowExecution execution)
    {
        var created = await _service.CreateAsync(execution);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, WorkflowExecution execution)
    {
        if (id != execution.Id)
            return BadRequest();

        var updated = await _service.UpdateAsync(id, execution);
        if (!updated)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }

    // Zmieniona trasa, aby nie było konfliktu
    [HttpPost("/api/Workflow/{id}/run")]
    public async Task<ActionResult<WorkflowExecution>> Run(int id, [FromBody] Dictionary<string, string>? inputs = null)
    {
        var workflow = await _context.Workflows
            .Include(w => w.Blocks).ThenInclude(b => b.SystemBlock)
            .Include(w => w.Blocks).ThenInclude(b => b.SourceConnections)
                .ThenInclude(c => c.TargetBlock).ThenInclude(tb => tb.SystemBlock)
            .Include(w => w.WorkflowVariables)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (workflow == null)
            return NotFound();

        var execution = await _service.EvaluateAsync(workflow, inputs);

        var dto = MapToDto(execution);

        return CreatedAtAction(nameof(GetById), new { id = execution.Id }, dto);
    }

    private static WorkflowExecutionDto MapToDto(WorkflowExecution execution) =>
        new()
        {
            Id = execution.Id,
            ExecutedAt = execution.ExecutedAt,
            WorkflowId = execution.WorkflowId,
            WorkflowName = execution.Workflow?.Name ?? $"Workflow #{execution.WorkflowId}",
            InputData = execution.Input,
            ResultData = execution.Result,
            Path = execution.Path ?? execution.SerializedPath,
            Actions = execution.Actions ?? execution.SerializedActions
        };
}
