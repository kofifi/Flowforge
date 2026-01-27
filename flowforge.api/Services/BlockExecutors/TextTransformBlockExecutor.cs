using Flowforge.Models;
using System.Collections.Generic;
using System;

namespace Flowforge.Services;

public class TextTransformBlockExecutor : IBlockExecutor
{
    private enum Operation
    {
        Trim,
        Lower,
        Upper
    }

    private record Config(string? Input, string? InputVariable, string? Operation, string? ResultVariable);

    public bool CanExecute(Block block) => block.SystemBlock?.Type == "TextTransform";

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        var input = string.Empty;
        var operation = Operation.Trim;
        var resultVariable = "result";

        if (!string.IsNullOrWhiteSpace(block.JsonConfig))
        {
            try
            {
                var cfg = System.Text.Json.JsonSerializer.Deserialize<Config>(block.JsonConfig);
                if (cfg != null)
                {
                    var opString = (cfg.Operation ?? string.Empty).Trim();
                    if (!string.IsNullOrWhiteSpace(opString) && Enum.TryParse<Operation>(opString, true, out var parsedOp))
                    {
                        operation = parsedOp;
                    }
                    resultVariable = string.IsNullOrWhiteSpace(cfg.ResultVariable) ? "result" : cfg.ResultVariable!;

                    if (!string.IsNullOrWhiteSpace(cfg.InputVariable))
                    {
                        var key = cfg.InputVariable!.Trim().TrimStart('$');
                        input = variables.GetValueOrDefault(key, string.Empty);
                    }
                    else if (cfg.Input != null)
                    {
                        input = cfg.Input;
                    }
                }
            }
            catch
            {
                // fall back to defaults
            }
        }

        var output = operation switch
        {
            Operation.Lower => input.ToLowerInvariant(),
            Operation.Upper => input.ToUpperInvariant(),
            _ => input.Trim()
        };

        variables[resultVariable] = output;

        var description = $"TextTransform {operation} -> {resultVariable}";
        return new BlockExecutionResult(description, false);
    }
}
