namespace Flowforge.Models;

public class WorkflowVariable
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public WorkflowVariableType Type { get; set; } = WorkflowVariableType.String;
    public string? DefaultValue { get; set; }

    public int WorkflowId { get; set; }
    public Workflow? Workflow { get; set; }
}