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
}
