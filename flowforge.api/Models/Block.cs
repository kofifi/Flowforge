namespace Flowforge.Models;

public class Block
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int WorkflowId { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public Workflow? Workflow { get; set; }
    public int SystemBlockId { get; set; }
    public SystemBlock? SystemBlock { get; set; }

    public string? JsonConfig { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }

    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<BlockConnection> SourceConnections { get; set; } = new List<BlockConnection>();

    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<BlockConnection> TargetConnections { get; set; } = new List<BlockConnection>();
}
