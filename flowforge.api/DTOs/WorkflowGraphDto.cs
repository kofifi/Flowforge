namespace Flowforge.DTOs;

public class WorkflowGraphDto
{
    public int WorkflowId { get; set; }
    public string Name { get; set; } = string.Empty;
    public IList<BlockGraphDto> Blocks { get; set; } = new List<BlockGraphDto>();
    public IList<BlockConnectionDto> Connections { get; set; } = new List<BlockConnectionDto>();
}

public class BlockGraphDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SystemBlockId { get; set; }
    public string SystemBlockType { get; set; } = string.Empty;
    public string? JsonConfig { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
}
