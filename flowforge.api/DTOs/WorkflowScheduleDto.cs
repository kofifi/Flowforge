namespace Flowforge.DTOs;

public class WorkflowScheduleDto
{
    public int Id { get; set; }
    public int WorkflowId { get; set; }
    public int? WorkflowRevisionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TriggerType { get; set; } = "Interval";
    public DateTime StartAtUtc { get; set; }
    public int? IntervalMinutes { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastRunAtUtc { get; set; }
    public DateTime? NextRunAtUtc { get; set; }
    public string TimeZoneId { get; set; } = "UTC";
}

public class UpsertWorkflowScheduleDto
{
    public int WorkflowId { get; set; }
    public int? WorkflowRevisionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TriggerType { get; set; } = "Interval";
    public DateTime StartAtUtc { get; set; }
    public int? IntervalMinutes { get; set; }
    public bool IsActive { get; set; } = true;
    public string TimeZoneId { get; set; } = "UTC";
}
