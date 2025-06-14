namespace Flowforge.Models;

public class Block
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int WorkflowId { get; set; }
    public Workflow? Workflow { get; set; }
    public int SystemBlockId { get; set; }
    public SystemBlock? SystemBlock { get; set; }

    public string? JsonConfig { get; set; }

    public ICollection<BlockConnection> SourceConnections { get; set; } = new List<BlockConnection>();
    public ICollection<BlockConnection> TargetConnections { get; set; } = new List<BlockConnection>();
}