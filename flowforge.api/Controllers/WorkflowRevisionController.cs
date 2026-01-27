using System.Collections.Generic;
using Flowforge.DTOs;
using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<ActionResult<IEnumerable<WorkflowRevisionDto>>> GetAll()
    {
        var revisions = await _service.GetAllAsync();
        return Ok(revisions.Select(MapToDto));
    }

    [HttpGet("workflow/{workflowId}")]
    public async Task<ActionResult<IEnumerable<WorkflowRevisionDto>>> GetByWorkflowId(int workflowId)
    {
        var revisions = await _service.GetByWorkflowIdAsync(workflowId);
        return Ok(revisions.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkflowRevisionDto>> GetById(int id)
    {
        var revision = await _service.GetByIdAsync(id);
        if (revision == null)
            return NotFound();
        return Ok(MapToDto(revision));
    }

    [HttpPost("workflow/{workflowId}")]
    public async Task<ActionResult<WorkflowRevisionDto>> CreateSnapshot(
        int workflowId,
        [FromBody] CreateWorkflowRevisionRequest? request)
    {
        var created = await _service.CreateSnapshotAsync(workflowId, request?.Label);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, MapToDto(created));
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
    public async Task<ActionResult<WorkflowRevisionDto>> GetLatestByWorkflowId(int workflowId)
    {
        var revision = await _service.GetLatestByWorkflowIdAsync(workflowId);
        if (revision == null)
            return NotFound();
        return Ok(MapToDto(revision));
    }

    [HttpPost("{revisionId}/restore")]
    public async Task<IActionResult> Restore(int revisionId)
    {
        var revision = await _service.GetByIdAsync(revisionId);
        if (revision == null)
            return NotFound();

        var result = await _service.RestoreRevisionAsync(revision.WorkflowId, revisionId);
        if (!result)
            return NotFound();

        return NoContent();
    }

    private static WorkflowRevisionDto MapToDto(WorkflowRevision revision) =>
        new()
        {
            Id = revision.Id,
            WorkflowId = revision.WorkflowId,
            Version = revision.Version,
            Label = revision.Label,
            CreatedAt = revision.CreatedAt,
            AppliedAt = revision.AppliedAt,
            IsActive = revision.IsActive
        };
}
