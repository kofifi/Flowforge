using Flowforge.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Flowforge.Models;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowController : ControllerBase
{
    private readonly FlowforgeDbContext _context;

    public WorkflowController(FlowforgeDbContext context)
    {
        _context = context;
    }

    // GET: api/Workflow
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Workflow>>> GetWorkflows()
    {
        return await _context.Workflows.ToListAsync();
    }

    // GET: api/Workflow/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Workflow>> GetWorkflow(int id)
    {
        var workflow = await _context.Workflows.FindAsync(id);
        if (workflow == null)
            return NotFound();
        return workflow;
    }

    // POST: api/Workflow
    [HttpPost]
    public async Task<ActionResult<Workflow>> CreateWorkflow(Workflow workflow)
    {
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetWorkflow), new { id = workflow.Id }, workflow);
    }

    // PUT: api/Workflow/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateWorkflow(int id, Workflow workflow)
    {
        if (id != workflow.Id)
            return BadRequest();

        _context.Entry(workflow).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Workflows.Any(e => e.Id == id))
                return NotFound();
            throw;
        }

        return NoContent();
    }

    // DELETE: api/Workflow/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorkflow(int id)
    {
        var workflow = await _context.Workflows.FindAsync(id);
        if (workflow == null)
            return NotFound();

        _context.Workflows.Remove(workflow);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}