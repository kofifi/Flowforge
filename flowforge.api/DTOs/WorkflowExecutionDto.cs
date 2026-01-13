using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Flowforge.DTOs;

public class WorkflowExecutionDto
{
    public int Id { get; set; }
    public DateTime ExecutedAt { get; set; }
    public int WorkflowId { get; set; }
    public string WorkflowName { get; set; } = string.Empty;

    [JsonPropertyName("inputData")]
    public Dictionary<string, string>? InputData { get; set; }

    [JsonPropertyName("resultData")]
    public Dictionary<string, string>? ResultData { get; set; }

    [JsonPropertyName("path")]
    public IList<string>? Path { get; set; }

    [JsonPropertyName("actions")]
    public IList<string>? Actions { get; set; }

}
