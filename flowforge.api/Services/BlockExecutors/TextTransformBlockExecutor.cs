using Flowforge.Models;
using System.Collections.Generic;
using System;
using System.Text;

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
                    var literalInput = cfg.Input ?? string.Empty;

                    var opString = (cfg.Operation ?? string.Empty).Trim();
                    if (!string.IsNullOrWhiteSpace(opString) && Enum.TryParse<Operation>(opString, true, out var parsedOp))
                    {
                        operation = parsedOp;
                    }
                    resultVariable = string.IsNullOrWhiteSpace(cfg.ResultVariable)
                        ? "result"
                        : cfg.ResultVariable!;

                    if (!string.IsNullOrWhiteSpace(cfg.InputVariable))
                    {
                        var key = cfg.InputVariable!.Trim().TrimStart('$');
                        var fromVariables = variables.GetValueOrDefault(key, string.Empty);
                        input = string.IsNullOrEmpty(fromVariables) ? literalInput : fromVariables;
                    }
                    else
                    {
                        input = literalInput;
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
            _ => RemoveAllWhitespace(input)
        };

        var resultKey = resultVariable.Trim().TrimStart('$');
        if (string.IsNullOrWhiteSpace(resultKey))
        {
            resultKey = "result";
        }

        variables[resultKey] = output;

        var description = $"TextTransform {operation} -> {resultKey}";
        return new BlockExecutionResult(description, false);
    }

    private static string RemoveAllWhitespace(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        // Usuń wszystkie znaki białe (spacja, tab, CR/LF itd.).
        var builder = new StringBuilder(value.Length);
        foreach (var ch in value)
        {
            if (!char.IsWhiteSpace(ch))
            {
                builder.Append(ch);
            }
        }
        return builder.ToString();
    }
}
