using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowVariableController : ControllerBase
{
    private readonly IWorkflowVariableService _service;

    public WorkflowVariableController(IWorkflowVariableService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkflowVariable>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkflowVariable>> GetById(int id)
    {
        var variable = await _service.GetByIdAsync(id);
        if (variable == null)
            return NotFound();
        return Ok(variable);
    }

    [HttpPost]
    public async Task<ActionResult<WorkflowVariable>> Create(WorkflowVariable variable)
    {
        var created = await _service.CreateAsync(variable);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, WorkflowVariable variable)
    {
        if (id != variable.Id)
            return BadRequest();
        var updated = await _service.UpdateAsync(id, variable);
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