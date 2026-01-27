namespace Flowforge.Models;

public class WorkflowSchedule
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TriggerType { get; set; } = "Interval"; // Interval, Once, Daily
    public DateTime StartAtUtc { get; set; }
    public int? IntervalMinutes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastRunAtUtc { get; set; }
    public DateTime? NextRunAtUtc { get; set; }

    public int WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;

    public int? WorkflowRevisionId { get; set; }
    public WorkflowRevision? WorkflowRevision { get; set; }
}
