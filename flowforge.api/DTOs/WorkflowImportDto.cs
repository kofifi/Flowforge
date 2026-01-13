namespace Flowforge.DTOs;

public class WorkflowImportDto
{
    public string Name { get; set; } = string.Empty;
    public List<BlockImportDto> Blocks { get; set; } = new();
    public List<BlockConnectionImportDto> Connections { get; set; } = new();
    public List<WorkflowVariableImportDto> Variables { get; set; } = new();
}

public class BlockImportDto
{
    public int? Id { get; set; }
    public int? OriginalId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SystemBlockType { get; set; } = string.Empty;
    public string? JsonConfig { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
}

public class BlockConnectionImportDto
{
    public int? SourceBlockId { get; set; }
    public int? TargetBlockId { get; set; }
    public int? SourceIndex { get; set; }
    public int? TargetIndex { get; set; }
    public string ConnectionType { get; set; } = "Success";
    public string? Label { get; set; }
}

public class WorkflowVariableImportDto
{
    public string Name { get; set; } = string.Empty;
    public string? DefaultValue { get; set; }
}
