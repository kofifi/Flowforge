using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public class WorkflowRevisionRepository : IWorkflowRevisionRepository
{
    private readonly FlowforgeDbContext _context;

    public WorkflowRevisionRepository(FlowforgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WorkflowRevision>> GetAllAsync()
    {
        return await _context.WorkflowRevisions.Include(r => r.Workflow).ToListAsync();
    }

    public async Task<WorkflowRevision?> GetByIdAsync(int id)
    {
        return await _context.WorkflowRevisions.Include(r => r.Workflow).FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<WorkflowRevision> AddAsync(WorkflowRevision revision)
    {
        _context.WorkflowRevisions.Add(revision);
        await _context.SaveChangesAsync();
        return revision;
    }

    public async Task<bool> UpdateAsync(WorkflowRevision revision)
    {
        if (!_context.WorkflowRevisions.Any(r => r.Id == revision.Id))
            return false;
        _context.WorkflowRevisions.Update(revision);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var revision = await _context.WorkflowRevisions.FindAsync(id);
        if (revision == null)
            return false;
        _context.WorkflowRevisions.Remove(revision);
        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task<WorkflowRevision?> GetLatestByWorkflowIdAsync(int workflowId)
    {
        return await _context.WorkflowRevisions
            .Where(r => r.WorkflowId == workflowId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();
    }
}