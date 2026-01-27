namespace Flowforge.Models;

public class WorkflowRevision
{
    public int Id { get; set; }
    public string Version { get; set; } = string.Empty;
    public string? Label { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AppliedAt { get; set; }
    public bool IsActive { get; set; }
    public string SnapshotJson { get; set; } = string.Empty;

    public int WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;
}
