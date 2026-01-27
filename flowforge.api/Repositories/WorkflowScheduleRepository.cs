using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;

namespace Flowforge.Repositories;

public class WorkflowScheduleRepository : IWorkflowScheduleRepository
{
    private readonly FlowforgeDbContext _context;

    public WorkflowScheduleRepository(FlowforgeDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<WorkflowSchedule>> GetAllAsync()
    {
        return await _context.WorkflowSchedules
            .Include(ws => ws.Workflow)
            .Include(ws => ws.WorkflowRevision)
            .OrderBy(ws => ws.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<WorkflowSchedule>> GetByWorkflowAsync(int workflowId)
    {
        return await _context.WorkflowSchedules
            .Where(ws => ws.WorkflowId == workflowId)
            .Include(ws => ws.WorkflowRevision)
            .OrderBy(ws => ws.StartAtUtc)
            .ToListAsync();
    }

    public async Task<IEnumerable<WorkflowSchedule>> GetDueAsync(DateTime asOfUtc)
    {
        return await _context.WorkflowSchedules
            .Where(ws => ws.IsActive && ws.NextRunAtUtc <= asOfUtc)
            .ToListAsync();
    }

    public async Task<WorkflowSchedule?> GetByIdAsync(int id)
    {
        return await _context.WorkflowSchedules
            .Include(ws => ws.Workflow)
            .Include(ws => ws.WorkflowRevision)
            .FirstOrDefaultAsync(ws => ws.Id == id);
    }

    public async Task<WorkflowSchedule> AddAsync(WorkflowSchedule schedule)
    {
        _context.WorkflowSchedules.Add(schedule);
        await _context.SaveChangesAsync();
        return schedule;
    }

    public async Task<bool> UpdateAsync(WorkflowSchedule schedule)
    {
        if (!_context.WorkflowSchedules.Any(ws => ws.Id == schedule.Id))
            return false;
        _context.WorkflowSchedules.Update(schedule);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var schedule = await _context.WorkflowSchedules.FindAsync(id);
        if (schedule == null)
            return false;
        _context.WorkflowSchedules.Remove(schedule);
        await _context.SaveChangesAsync();
        return true;
    }
}
