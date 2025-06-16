using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Flowforge.DTOs;

public class WorkflowExecutionDto
{
    public int Id { get; set; }
    public DateTime ExecutedAt { get; set; }

    [JsonPropertyName("inputData")]
    public Dictionary<string, string>? InputData { get; set; }

    [JsonPropertyName("resultData")]
    public Dictionary<string, string>? ResultData { get; set; }

    [JsonPropertyName("path")]
    public IList<string>? Path { get; set; }
}
