namespace Flowforge.Models;

public class WorkflowExecution
{
    public int Id { get; set; }
    public DateTime ExecutedAt { get; set; }
    public string? InputData { get; set; }
    public string? ResultData { get; set; }

    public int WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;
}