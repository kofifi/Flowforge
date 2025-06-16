using System.Text.Json.Serialization;

namespace Flowforge.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ConditionDataType
{
    Number,
    String
}

public class ConditionConfig
{
    public ConditionDataType DataType { get; set; } = ConditionDataType.String;
    public string First { get; set; } = string.Empty;
    public string Second { get; set; } = string.Empty;
}

