namespace Flowforge.DTOs;

public class BlockConnectionDto
{
    public int Id { get; set; }
    public int SourceBlockId { get; set; }
    public int TargetBlockId { get; set; }
    public string? ConnectionType { get; set; }
    public string? Label { get; set; }
}
