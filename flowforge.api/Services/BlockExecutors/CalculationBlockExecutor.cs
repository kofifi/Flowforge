using Flowforge.Models;
using System.Collections.Generic;
using System.Globalization;
using System.Text.Json;

namespace Flowforge.Services;

public class CalculationBlockExecutor : IBlockExecutor
{
    public bool CanExecute(Block block)
        => block.SystemBlock?.Type == "Calculation" && !string.IsNullOrEmpty(block.JsonConfig);

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        var config = JsonSerializer.Deserialize<CalculationConfig>(block.JsonConfig!);
        if (config == null)
            return new BlockExecutionResult($"Invalid config for block {block.Name}", true);

        var first = variables.ContainsKey(config.FirstVariable) ? variables[config.FirstVariable] : string.Empty;
        var second = variables.ContainsKey(config.SecondVariable) ? variables[config.SecondVariable] : string.Empty;
        var destination = string.IsNullOrEmpty(config.ResultVariable) ? config.FirstVariable : config.ResultVariable;
        var symbol = config.Operation switch
        {
            CalculationOperation.Add => "+",
            CalculationOperation.Subtract => "-",
            CalculationOperation.Multiply => "*",
            CalculationOperation.Divide => "/",
            CalculationOperation.Concat => "+",
            _ => string.Empty
        };

        switch (config.Operation)
        {
            case CalculationOperation.Concat:
                variables[destination] = first + second;
                return new BlockExecutionResult($"{destination} = {first} + {second}", false);
            default:
                TryParseNumber(first, out var a);
                TryParseNumber(second, out var b);
                var result = config.Operation switch
                {
                    CalculationOperation.Add => a + b,
                    CalculationOperation.Subtract => a - b,
                    CalculationOperation.Multiply => a * b,
                    CalculationOperation.Divide => b == 0 ? a : a / b,
                    _ => a
                };
                variables[destination] = result.ToString(CultureInfo.InvariantCulture);
                return new BlockExecutionResult($"{destination} = {a} {symbol} {b} => {result}", false);
        }
    }

    private static bool TryParseNumber(string? input, out double value)
    {
        if (double.TryParse(input, NumberStyles.Float, CultureInfo.InvariantCulture, out value))
            return true;

        if (double.TryParse(input, NumberStyles.Float, CultureInfo.CurrentCulture, out value))
            return true;

        if (input is not null)
        {
            var normalized = input.Replace(',', '.');
            if (double.TryParse(normalized, NumberStyles.Float, CultureInfo.InvariantCulture, out value))
                return true;
        }

        value = 0;
        return false;
    }
}
