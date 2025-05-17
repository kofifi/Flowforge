using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public class WorkflowExecutionRepository : IWorkflowExecutionRepository
{
    private readonly FlowforgeDbContext _context;

    public WorkflowExecutionRepository(FlowforgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WorkflowExecution>> GetAllAsync()
    {
        return await _context.WorkflowExecutions
            .Include(e => e.Workflow)
            .ToListAsync();
    }

    public async Task<WorkflowExecution?> GetByIdAsync(int id)
    {
        return await _context.WorkflowExecutions
            .Include(e => e.Workflow)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<WorkflowExecution> AddAsync(WorkflowExecution execution)
    {
        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync();
        return execution;
    }

    public async Task<bool> UpdateAsync(WorkflowExecution execution)
    {
        if (!_context.WorkflowExecutions.Any(e => e.Id == execution.Id))
            return false;
        _context.WorkflowExecutions.Update(execution);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var execution = await _context.WorkflowExecutions.FindAsync(id);
        if (execution == null)
            return false;
        _context.WorkflowExecutions.Remove(execution);
        await _context.SaveChangesAsync();
        return true;
    }
}