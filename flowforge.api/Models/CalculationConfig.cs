namespace Flowforge.Models;

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
    public string FirstVariable { get; set; } = string.Empty;
    public string SecondVariable { get; set; } = string.Empty;
}
