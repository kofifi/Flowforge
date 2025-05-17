using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowExecutionController : ControllerBase
{
    private readonly IWorkflowExecutionService _service;

    public WorkflowExecutionController(IWorkflowExecutionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkflowExecution>>> GetAll()
    {
        var executions = await _service.GetAllAsync();
        return Ok(executions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkflowExecution>> GetById(int id)
    {
        var execution = await _service.GetByIdAsync(id);
        if (execution == null)
            return NotFound();
        return Ok(execution);
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
}