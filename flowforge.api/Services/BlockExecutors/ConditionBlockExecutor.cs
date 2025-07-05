using Flowforge.Models;
using System.Collections.Generic;
using System.Text.Json;

namespace Flowforge.Services;

public class ConditionBlockExecutor : IBlockExecutor
{
    public bool CanExecute(Block block)
        => block.SystemBlock?.Type == "If" && !string.IsNullOrEmpty(block.JsonConfig);

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        var config = JsonSerializer.Deserialize<ConditionConfig>(block.JsonConfig!);
        if (config == null)
            return new BlockExecutionResult($"Invalid config for block {block.Name}", true);

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
        bool condition;

        if (config.DataType == ConditionDataType.Number)
        {
            double.TryParse(first, out var a);
            double.TryParse(second, out var b);
            condition = a == b;
        }
        else
        {
            condition = first == second;
        }

        var description = $"IF {first} == {second}";
        return new BlockExecutionResult(description, !condition);
    }
}
