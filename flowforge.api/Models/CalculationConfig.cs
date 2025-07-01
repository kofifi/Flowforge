namespace Flowforge.Models;
using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CalculationOperation
{
    Add,
    Subtract,
    Multiply,
    Divide,
    Concat
}

public class CalculationConfig
{
    public CalculationOperation Operation { get; set; } = CalculationOperation.Add;
    /// <summary>
    /// Either a literal value or a variable reference starting with '$'.
    /// </summary>
    public string First { get; set; } = string.Empty;
    /// <summary>
    /// Either a literal value or a variable reference starting with '$'.
    /// </summary>
    public string Second { get; set; } = string.Empty;
    /// <summary>
    /// Destination variable name prefixed with '$'. If empty, the first value's
    /// variable reference will be used when available.
    /// </summary>
    public string Result { get; set; } = string.Empty;
}
