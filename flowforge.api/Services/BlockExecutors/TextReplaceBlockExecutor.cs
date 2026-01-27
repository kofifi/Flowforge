using Flowforge.Models;
using System.Collections.Generic;
using System;
using System.Text.RegularExpressions;

namespace Flowforge.Services;

public class TextReplaceBlockExecutor : IBlockExecutor
{
    private record ReplaceRule(string? From, string? To, bool? UseRegex, bool? IgnoreCase);
    private record Config(string? Input, string? InputVariable, string? ResultVariable, List<ReplaceRule>? Replacements);

    public bool CanExecute(Block block) => block.SystemBlock?.Type == "TextReplace";

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        var input = string.Empty;
        var resultVariable = "result";
        var replacements = new List<ReplaceRule>();

        if (!string.IsNullOrWhiteSpace(block.JsonConfig))
        {
            try
            {
                var cfg = System.Text.Json.JsonSerializer.Deserialize<Config>(block.JsonConfig);
                if (cfg != null)
                {
                    if (!string.IsNullOrWhiteSpace(cfg.ResultVariable))
                    {
                        resultVariable = cfg.ResultVariable!;
                    }

                    if (!string.IsNullOrWhiteSpace(cfg.InputVariable))
                    {
                        var key = cfg.InputVariable!.Trim().TrimStart('$');
                        input = variables.GetValueOrDefault(key, string.Empty);
                    }
                    else if (cfg.Input != null)
                    {
                        input = cfg.Input;
                    }

                    if (cfg.Replacements != null)
                    {
                        replacements.AddRange(cfg.Replacements);
                    }
                }
            }
            catch
            {
                // fallback to defaults
            }
        }

        var output = ApplyReplacements(input, replacements);
        variables[resultVariable] = output;
        var desc = $"TextReplace -> {resultVariable} ({replacements.Count} rule(s))";
        return new BlockExecutionResult(desc, false);
    }

    private static string ApplyReplacements(string input, List<ReplaceRule> rules)
    {
        var current = input;
        foreach (var rule in rules)
        {
            var from = rule.From ?? string.Empty;
            var to = rule.To ?? string.Empty;
            var useRegex = rule.UseRegex == true;
            var ignoreCase = rule.IgnoreCase == true;
            if (from.Length == 0) continue;

            if (useRegex)
            {
                try
                {
                    var options = RegexOptions.CultureInvariant | RegexOptions.Multiline;
                    if (ignoreCase) options |= RegexOptions.IgnoreCase;
                    current = Regex.Replace(current, from, to, options, TimeSpan.FromMilliseconds(250));
                }
                catch
                {
                    // ignore bad regex, skip rule
                }
            }
            else
            {
                var comparison = ignoreCase ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
                current = current.Replace(from, to, comparison);
            }
        }
        return current;
    }
}
