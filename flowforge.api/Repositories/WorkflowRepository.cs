namespace Flowforge.Repositories;
using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;

public class WorkflowRepository : IWorkflowRepository
{
    private readonly FlowforgeDbContext _context;

    public WorkflowRepository(FlowforgeDbContext context)
    {
        _context = context;
    }

    public async Task<List<Workflow>> GetAllAsync()
        => await _context.Workflows.ToListAsync();

    public async Task<Workflow?> GetByIdAsync(int id)
        => await _context.Workflows.FindAsync(id);

    public async Task<Workflow> AddAsync(Workflow workflow)
    {
        _context.Workflows.Add(workflow);
        await _context.SaveChangesAsync();
        return workflow;
    }

    public async Task<bool> UpdateAsync(Workflow workflow)
    {
        _context.Entry(workflow).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Workflows.AnyAsync(e => e.Id == workflow.Id))
                return false;
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var workflow = await _context.Workflows.FindAsync(id);
        if (workflow == null)
            return false;

        _context.Workflows.Remove(workflow);
        await _context.SaveChangesAsync();
        return true;
    }
}