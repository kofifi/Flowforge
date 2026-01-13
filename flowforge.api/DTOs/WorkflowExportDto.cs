using Flowforge.Models;

namespace Flowforge.DTOs;

public class WorkflowExportDto
{
    public string Name { get; set; } = string.Empty;
    public List<BlockExportDto> Blocks { get; set; } = new();
    public List<BlockConnectionExportDto> Connections { get; set; } = new();
    public List<WorkflowVariableExportDto> Variables { get; set; } = new();
}

public class BlockExportDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SystemBlockType { get; set; } = string.Empty;
    public string? JsonConfig { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
}

public class BlockConnectionExportDto
{
    public int SourceBlockId { get; set; }
    public int TargetBlockId { get; set; }
    public string ConnectionType { get; set; } = "Success";
    public string? Label { get; set; }
}

public class WorkflowVariableExportDto
{
    public string Name { get; set; } = string.Empty;
    public string? DefaultValue { get; set; }
}
