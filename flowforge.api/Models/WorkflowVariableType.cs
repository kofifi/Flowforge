using System.Text.Json.Serialization;

namespace Flowforge.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WorkflowVariableType
{
    String,
    Number
}
