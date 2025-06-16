using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Flowforge.Models;

public class WorkflowExecution
{
    public int Id { get; set; }
    public DateTime ExecutedAt { get; set; }

    [JsonIgnore]
    public string? InputData { get; set; }

    [JsonIgnore]
    public string? ResultData { get; set; }

    [NotMapped]
    [JsonPropertyName("inputData")]
    public Dictionary<string, string>? Input
    {
        get => string.IsNullOrWhiteSpace(InputData)
            ? null
            : JsonSerializer.Deserialize<Dictionary<string, string>>(InputData!);
        set => InputData = value == null ? null : JsonSerializer.Serialize(value);
    }

    [NotMapped]
    [JsonPropertyName("resultData")]
    public Dictionary<string, string>? Result
    {
        get => string.IsNullOrWhiteSpace(ResultData)
            ? null
            : JsonSerializer.Deserialize<Dictionary<string, string>>(ResultData!);
        set => ResultData = value == null ? null : JsonSerializer.Serialize(value);
    }

    public int WorkflowId { get; set; }
    public Workflow Workflow { get; set; } = null!;

    [NotMapped]
    [JsonPropertyName("path")]
    public IList<string>? Path { get; set; }
}
