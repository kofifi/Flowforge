using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowRevisionController : ControllerBase
{
    private readonly IWorkflowRevisionService _service;

    public WorkflowRevisionController(IWorkflowRevisionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkflowRevision>>> GetAll()
    {
        var revisions = await _service.GetAllAsync();
        return Ok(revisions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkflowRevision>> GetById(int id)
    {
        var revision = await _service.GetByIdAsync(id);
        if (revision == null)
            return NotFound();
        return Ok(revision);
    }

    [HttpPost]
    public async Task<ActionResult<WorkflowRevision>> Create(WorkflowRevision revision)
    {
        var created = await _service.CreateAsync(revision);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, WorkflowRevision revision)
    {
        if (id != revision.Id)
            return BadRequest();
        var updated = await _service.UpdateAsync(id, revision);
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
    
    [HttpGet("latest/{workflowId}")]
    public async Task<ActionResult<WorkflowRevision>> GetLatestByWorkflowId(int workflowId)
    {
        var revision = await _service.GetLatestByWorkflowIdAsync(workflowId);
        if (revision == null)
            return NotFound();
        return Ok(revision);
    }
    
    [HttpPost("rollback/{workflowId}/{revisionId}")]
    public async Task<IActionResult> RollbackToRevision(int workflowId, int revisionId)
    {
        var result = await _service.RollbackToRevisionAsync(workflowId, revisionId);
        if (!result)
            return NotFound();
        return NoContent();
    }
}