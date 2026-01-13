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

    [JsonIgnore]
    public string? PathData { get; set; }

    [JsonIgnore]
    public string? ActionsData { get; set; }

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
  
    [NotMapped]
    [JsonPropertyName("actions")]
    public IList<string>? Actions { get; set; }

    [NotMapped]
    public IList<string>? SerializedPath
    {
        get => string.IsNullOrWhiteSpace(PathData)
            ? new List<string>()
            : JsonSerializer.Deserialize<IList<string>>(PathData!);
        set => PathData = value == null ? null : JsonSerializer.Serialize(value);
    }

    [NotMapped]
    public IList<string>? SerializedActions
    {
        get => string.IsNullOrWhiteSpace(ActionsData)
            ? new List<string>()
            : JsonSerializer.Deserialize<IList<string>>(ActionsData!);
        set => ActionsData = value == null ? null : JsonSerializer.Serialize(value);
    }

}
