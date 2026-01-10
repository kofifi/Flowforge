using Flowforge.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace Flowforge.Services;

public class SwitchBlockExecutor : IBlockExecutor
{
    public bool CanExecute(Block block)
        => block.SystemBlock?.Type == "Switch" && !string.IsNullOrEmpty(block.JsonConfig);

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        var config = JsonSerializer.Deserialize<SwitchConfig>(block.JsonConfig!);
        if (config == null)
        {
            return new BlockExecutionResult($"Invalid config for block {block.Name}", true);
        }

        string Resolve(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            if (value.StartsWith("$"))
            {
                var key = value.Substring(1);
                return variables.TryGetValue(key, out var v) ? v : string.Empty;
            }
            return value;
        }

        var evaluated = Resolve(config.Expression);
        var description = $"SWITCH {config.Expression} => {evaluated}";

        // Switch executor itself does not choose the path; routing happens when enqueuing edges by label.
        // Returning Error=false lets the workflow continue; label matching is handled in WorkflowExecutionService.
        return new BlockExecutionResult(description, false);
    }
}
