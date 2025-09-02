using Flowforge.Models;
using System.Collections.Generic;
using System.Text.Json;

namespace Flowforge.Services.Executors;

public class ConditionBlockExecutor : IBlockExecutor
{
    public string BlockType => "If";

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        if (string.IsNullOrEmpty(block.JsonConfig))
            return new BlockExecutionResult("IF missing config", true);

        var config = JsonSerializer.Deserialize<ConditionConfig>(block.JsonConfig);
        if (config == null)
            return new BlockExecutionResult("IF invalid config", true);

        string GetValue(string val)
        {
            if (val.StartsWith("$"))
            {
                var key = val.Substring(1);
                return variables.ContainsKey(key) ? variables[key] : string.Empty;
            }
            return val;
        }

        var first = GetValue(config.First);
        var second = GetValue(config.Second);

        bool condition = false;
        string opSymbol = config.Operation switch
        {
            ConditionOperation.NotEqual => "!=",
            ConditionOperation.GreaterThan => ">",
            ConditionOperation.LessThan => "<",
            ConditionOperation.GreaterOrEqual => ">=",
            ConditionOperation.LessOrEqual => "<=",
            _ => "=="
        };

        if (config.DataType == ConditionDataType.Number)
        {
            double.TryParse(first, out var a);
            double.TryParse(second, out var b);
            condition = config.Operation switch
            {
                ConditionOperation.NotEqual => a != b,
                ConditionOperation.GreaterThan => a > b,
                ConditionOperation.LessThan => a < b,
                ConditionOperation.GreaterOrEqual => a >= b,
                ConditionOperation.LessOrEqual => a <= b,
                _ => a == b
            };
        }
        else
        {
            condition = config.Operation switch
            {
                ConditionOperation.NotEqual => first != second,
                ConditionOperation.GreaterThan => string.Compare(first, second) > 0,
                ConditionOperation.LessThan => string.Compare(first, second) < 0,
                ConditionOperation.GreaterOrEqual => string.Compare(first, second) >= 0,
                ConditionOperation.LessOrEqual => string.Compare(first, second) <= 0,
                _ => first == second
            };
        }

        var description = $"IF {first} {opSymbol} {second}";
        return new BlockExecutionResult(description, !condition);
    }
}

