namespace Flowforge.Models;

public class SystemBlock
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<Block> Blocks { get; set; } = new List<Block>();
}
