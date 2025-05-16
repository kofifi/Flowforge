namespace Flowforge.Models;

public class Workflow
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<Block> Blocks { get; set; } = new List<Block>();
    public ICollection<WorkflowVariable> WorkflowVariables { get; set; } = new List<WorkflowVariable>();
    public ICollection<WorkflowRevision> WorkflowRevisions { get; set; } = new List<WorkflowRevision>();
    public ICollection<WorkflowExecution> WorkflowExecutions { get; set; } = new List<WorkflowExecution>();
}