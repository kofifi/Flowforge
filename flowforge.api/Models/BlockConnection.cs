using System.Text.Json.Serialization;

namespace Flowforge.Models;

public class BlockConnection
{
    public int Id { get; set; }

    public int SourceBlockId { get; set; }
    public Block SourceBlock { get; set; } = null!;

    public int TargetBlockId { get; set; }
    public Block TargetBlock { get; set; } = null!;

    public ConnectionType ConnectionType { get; set; } = ConnectionType.Success;

    /// <summary>
    /// Optional label used by multi-branch blocks (e.g., Switch) to route by case.
    /// </summary>
    public string? Label { get; set; }
}
