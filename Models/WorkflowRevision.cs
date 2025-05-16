namespace Flowforge.Models;

public class WorkflowRevision
{
    public int Id { get; set; }
    public string Version { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public int WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;
}