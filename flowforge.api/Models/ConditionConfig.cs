using System.Text.Json.Serialization;

namespace Flowforge.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ConditionDataType
{
    Number,
    String
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ConditionOperation
{
    Equal,
    NotEqual,
    GreaterThan,
    LessThan,
    GreaterOrEqual,
    LessOrEqual
}

public class ConditionConfig
{
    public ConditionDataType DataType { get; set; } = ConditionDataType.String;
    public ConditionOperation Operation { get; set; } = ConditionOperation.Equal;
    public string First { get; set; } = string.Empty;
    public string Second { get; set; } = string.Empty;
}

