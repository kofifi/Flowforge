using Flowforge.Models;
using System.Collections.Generic;
using System.Text.Json;

namespace Flowforge.Services.Executors;

public class CalculationBlockExecutor : IBlockExecutor
{
    public string BlockType => "Calculation";

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        if (string.IsNullOrEmpty(block.JsonConfig))
            return new BlockExecutionResult("Missing calculation config", false);

        var config = JsonSerializer.Deserialize<CalculationConfig>(block.JsonConfig);
        if (config == null)
            return new BlockExecutionResult("Invalid calculation config", false);

        var first = variables.ContainsKey(config.FirstVariable) ? variables[config.FirstVariable] : string.Empty;
        var second = variables.ContainsKey(config.SecondVariable) ? variables[config.SecondVariable] : string.Empty;
        var destination = string.IsNullOrEmpty(config.ResultVariable)
            ? config.FirstVariable
            : config.ResultVariable;

        var symbol = config.Operation switch
        {
            CalculationOperation.Add => "+",
            CalculationOperation.Subtract => "-",
            CalculationOperation.Multiply => "*",
            CalculationOperation.Divide => "/",
            CalculationOperation.Concat => "+",
            _ => string.Empty
        };

        string description;
        switch (config.Operation)
        {
            case CalculationOperation.Concat:
                variables[destination] = first + second;
                description = $"{destination} = {first} + {second}";
                break;
            default:
                double.TryParse(first, out var a);
                double.TryParse(second, out var b);
                var result = config.Operation switch
                {
                    CalculationOperation.Add => a + b,
                    CalculationOperation.Subtract => a - b,
                    CalculationOperation.Multiply => a * b,
                    CalculationOperation.Divide => b == 0 ? a : a / b,
                    _ => a
                };
                variables[destination] = result.ToString();
                description = $"{destination} = {a} {symbol} {b} => {result}";
                break;
        }

        return new BlockExecutionResult(description, false);
    }
}

