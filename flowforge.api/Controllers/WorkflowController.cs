using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowController : ControllerBase
{
    private readonly WorkflowService _service;

    public WorkflowController(WorkflowService service)
    {
        _service = service;
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