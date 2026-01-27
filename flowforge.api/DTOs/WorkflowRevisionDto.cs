namespace Flowforge.DTOs;

public class WorkflowRevisionDto
{
    public int Id { get; set; }
    public int WorkflowId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string? Label { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AppliedAt { get; set; }
    public bool IsActive { get; set; }
}

public class CreateWorkflowRevisionRequest
{
    public string? Label { get; set; }
}
