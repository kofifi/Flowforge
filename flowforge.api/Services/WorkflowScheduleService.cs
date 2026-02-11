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

        var tz = SafeTimeZone(schedule.TimeZoneId);
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
            var basisLocal = TimeZoneInfo.ConvertTimeFromUtc(last ?? now, tz);
            var startLocal = TimeZoneInfo.ConvertTimeFromUtc(start, tz);
            var targetLocal = new DateTime(basisLocal.Year, basisLocal.Month, basisLocal.Day, startLocal.Hour, startLocal.Minute, startLocal.Second, DateTimeKind.Unspecified);
            if (targetLocal <= basisLocal)
            {
                targetLocal = targetLocal.AddDays(1);
            }
            var targetUtc = TimeZoneInfo.ConvertTimeToUtc(targetLocal, tz);
            return targetUtc <= now && last == null
                ? TimeZoneInfo.ConvertTimeToUtc(targetLocal.AddDays(1), tz)
                : targetUtc;
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

    private static TimeZoneInfo SafeTimeZone(string? timeZoneId)
    {
        var id = string.IsNullOrWhiteSpace(timeZoneId) ? "UTC" : timeZoneId.Trim();
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch
        {
            return TimeZoneInfo.Utc;
        }
    }
}
