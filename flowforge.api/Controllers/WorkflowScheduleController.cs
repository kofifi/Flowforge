using System.Collections.Generic;
using System.Linq;
using Flowforge.DTOs;
using Flowforge.Models;
using Flowforge.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Flowforge.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowScheduleController : ControllerBase
{
    private readonly IWorkflowScheduleService _service;
    private readonly IWorkflowExecutionService _executionService;
    private readonly Data.FlowforgeDbContext _context;

    public WorkflowScheduleController(IWorkflowScheduleService service, IWorkflowExecutionService executionService, Data.FlowforgeDbContext context)
    {
        _service = service;
        _executionService = executionService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkflowScheduleDto>>> GetAll()
    {
        var schedules = await _service.GetAllAsync();
        return Ok(schedules.Select(MapToDto));
    }

    [HttpGet("workflow/{workflowId}")]
    public async Task<ActionResult<IEnumerable<WorkflowScheduleDto>>> GetByWorkflow(int workflowId)
    {
        var schedules = await _service.GetByWorkflowAsync(workflowId);
        return Ok(schedules.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkflowScheduleDto>> GetById(int id)
    {
        var schedule = await _service.GetByIdAsync(id);
        if (schedule == null)
            return NotFound();
        return Ok(MapToDto(schedule));
    }

    [HttpPost]
    public async Task<ActionResult<WorkflowScheduleDto>> Create([FromBody] UpsertWorkflowScheduleDto dto)
    {
        var schedule = await _service.CreateAsync(MapToEntity(dto));
        return CreatedAtAction(nameof(GetById), new { id = schedule.Id }, MapToDto(schedule));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertWorkflowScheduleDto dto)
    {
        var schedule = MapToEntity(dto, id);
        var updated = await _service.UpdateAsync(id, schedule);
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

    [HttpPost("{id}/run")]
    public async Task<IActionResult> RunNow(int id)
    {
        var schedule = await _service.GetByIdAsync(id);
        if (schedule == null)
            return NotFound();

        var workflow = await _context.Workflows
            .Include(w => w.Blocks).ThenInclude(b => b.SystemBlock)
            .Include(w => w.Blocks).ThenInclude(b => b.SourceConnections).ThenInclude(c => c.TargetBlock).ThenInclude(tb => tb.SystemBlock)
            .Include(w => w.WorkflowVariables)
            .FirstOrDefaultAsync(w => w.Id == schedule.WorkflowId);

        if (workflow == null)
            return NotFound();

        await _executionService.EvaluateAsync(workflow, null, skipWaits: true);

        schedule.LastRunAtUtc = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        schedule.NextRunAtUtc = null;
        schedule.NextRunAtUtc = CalculateNextRun(schedule);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static WorkflowScheduleDto MapToDto(WorkflowSchedule schedule) => new()
    {
        Id = schedule.Id,
        WorkflowId = schedule.WorkflowId,
        WorkflowRevisionId = schedule.WorkflowRevisionId,
        Name = schedule.Name,
        Description = schedule.Description,
        TriggerType = schedule.TriggerType,
        StartAtUtc = DateTime.SpecifyKind(schedule.StartAtUtc, DateTimeKind.Utc),
        IntervalMinutes = schedule.IntervalMinutes,
        IsActive = schedule.IsActive,
        TimeZoneId = string.IsNullOrWhiteSpace(schedule.TimeZoneId) ? "UTC" : schedule.TimeZoneId,
        LastRunAtUtc = schedule.LastRunAtUtc.HasValue
            ? DateTime.SpecifyKind(schedule.LastRunAtUtc.Value, DateTimeKind.Utc)
            : null,
        NextRunAtUtc = schedule.NextRunAtUtc.HasValue
            ? DateTime.SpecifyKind(schedule.NextRunAtUtc.Value, DateTimeKind.Utc)
            : null
    };

    private static WorkflowSchedule MapToEntity(UpsertWorkflowScheduleDto dto, int? id = null) => new()
    {
        Id = id ?? 0,
        WorkflowId = dto.WorkflowId,
        WorkflowRevisionId = dto.WorkflowRevisionId,
        Name = dto.Name,
        Description = dto.Description,
        TriggerType = string.IsNullOrWhiteSpace(dto.TriggerType) ? "Interval" : dto.TriggerType,
        StartAtUtc = dto.StartAtUtc == default
            ? DateTime.UtcNow
            : DateTime.SpecifyKind(dto.StartAtUtc, DateTimeKind.Utc),
        IntervalMinutes = dto.IntervalMinutes,
        IsActive = dto.IsActive,
        TimeZoneId = string.IsNullOrWhiteSpace(dto.TimeZoneId) ? "UTC" : dto.TimeZoneId
    };

    private static DateTime? CalculateNextRun(WorkflowSchedule schedule)
    {
        if (!schedule.IsActive)
            return null;

        var tz = SafeTimeZone(schedule.TimeZoneId);
        var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        var start = schedule.StartAtUtc == default ? now : DateTime.SpecifyKind(schedule.StartAtUtc, DateTimeKind.Utc);
        var trigger = schedule.TriggerType?.Trim().ToLowerInvariant() ?? "";
        var last = schedule.LastRunAtUtc.HasValue ? DateTime.SpecifyKind(schedule.LastRunAtUtc.Value, DateTimeKind.Utc) : (DateTime?)null;

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
