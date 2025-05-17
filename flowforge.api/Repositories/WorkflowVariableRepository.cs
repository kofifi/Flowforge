using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public class WorkflowVariableRepository : IWorkflowVariableRepository
{
    private readonly FlowforgeDbContext _context;

    public WorkflowVariableRepository(FlowforgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WorkflowVariable>> GetAllAsync()
        => await _context.WorkflowVariables.Include(wv => wv.Workflow).ToListAsync();

    public async Task<WorkflowVariable?> GetByIdAsync(int id)
        => await _context.WorkflowVariables.Include(wv => wv.Workflow).FirstOrDefaultAsync(wv => wv.Id == id);

    public async Task<WorkflowVariable> AddAsync(WorkflowVariable variable)
    {
        _context.WorkflowVariables.Add(variable);
        await _context.SaveChangesAsync();
        return variable;
    }

    public async Task<bool> UpdateAsync(WorkflowVariable variable)
    {
        if (!_context.WorkflowVariables.Any(wv => wv.Id == variable.Id))
            return false;
        _context.WorkflowVariables.Update(variable);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var variable = await _context.WorkflowVariables.FindAsync(id);
        if (variable == null)
            return false;
        _context.WorkflowVariables.Remove(variable);
        await _context.SaveChangesAsync();
        return true;
    }
}