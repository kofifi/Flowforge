using Flowforge.Models;
using Flowforge.Repositories;

namespace Flowforge.Services;

public class WorkflowScheduleService : IWorkflowScheduleService
{
    private readonly IWorkflowScheduleRepository _repository;

    public WorkflowScheduleService(IWorkflowScheduleRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<WorkflowSchedule>> GetAllAsync() => _repository.GetAllAsync();

    public Task<IEnumerable<WorkflowSchedule>> GetByWorkflowAsync(int workflowId) => _repository.GetByWorkflowAsync(workflowId);

    public Task<IEnumerable<WorkflowSchedule>> GetDueAsync(DateTime asOfUtc) => _repository.GetDueAsync(asOfUtc);

    public Task<WorkflowSchedule?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public async Task<WorkflowSchedule> CreateAsync(WorkflowSchedule schedule)
    {
        schedule.NextRunAtUtc = CalculateNextRun(schedule);
        return await _repository.AddAsync(schedule);
    }

    public async Task<bool> UpdateAsync(int id, WorkflowSchedule schedule)
    {
        if (id != schedule.Id)
            return false;

        schedule.NextRunAtUtc = CalculateNextRun(schedule);
        return await _repository.UpdateAsync(schedule);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);

    private static DateTime? CalculateNextRun(WorkflowSchedule schedule)
    {
        if (!schedule.IsActive)
            return null;

        var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        var start = schedule.StartAtUtc == default
            ? now
            : DateTime.SpecifyKind(schedule.StartAtUtc, DateTimeKind.Utc);
        var trigger = schedule.TriggerType?.Trim().ToLowerInvariant() ?? "";
        var last = schedule.LastRunAtUtc.HasValue
            ? DateTime.SpecifyKind(schedule.LastRunAtUtc.Value, DateTimeKind.Utc)
            : (DateTime?)null;

        if (trigger == "daily")
        {
            var basis = last ?? now;
            var target = new DateTime(basis.Year, basis.Month, basis.Day, start.Hour, start.Minute, start.Second, DateTimeKind.Utc);
            if (target <= basis)
            {
                target = target.AddDays(1);
            }
            if (target <= now && last == null)
            {
                target = new DateTime(now.Year, now.Month, now.Day, start.Hour, start.Minute, start.Second, DateTimeKind.Utc);
                if (target <= now)
                {
                    target = target.AddDays(1);
                }
            }
            return target;
        }

        if (trigger == "once" || !schedule.IntervalMinutes.HasValue)
        {
            if (start > now)
                return start;
            return last.HasValue ? (DateTime?)null : (start > now ? start : (DateTime?)null);
        }

        var interval = Math.Max(1, schedule.IntervalMinutes.Value);
        if (last.HasValue)
        {
            var nextFromLast = last.Value.AddMinutes(interval);
            return nextFromLast > now ? nextFromLast : now.AddMinutes(interval);
        }

        if (schedule.NextRunAtUtc.HasValue && schedule.NextRunAtUtc.Value > now)
            return schedule.NextRunAtUtc;

        return start > now ? start : now.AddMinutes(interval);
    }
}
