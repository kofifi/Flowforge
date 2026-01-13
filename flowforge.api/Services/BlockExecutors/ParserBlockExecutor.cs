using System.Text.Json;
using System.Text.Json.Serialization;
using System.Xml.XPath;
using Flowforge.Models;
using System.Xml;

namespace Flowforge.Services;

public class ParserBlockExecutor : IBlockExecutor
{
    public bool CanExecute(Block block)
        => block.SystemBlock?.Type == "Parser" && !string.IsNullOrWhiteSpace(block.JsonConfig);

    public BlockExecutionResult Execute(Block block, Dictionary<string, string> variables)
    {
        if (string.IsNullOrWhiteSpace(block.JsonConfig))
        {
            return new BlockExecutionResult($"Parser block '{block.Name}' has no config.", true);
        }

        ParserConfig? config;
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
            config = JsonSerializer.Deserialize<ParserConfig>(block.JsonConfig, options);
        }
        catch (Exception ex)
        {
            return new BlockExecutionResult($"Invalid parser config: {ex.Message}", true);
        }

        if (config == null || string.IsNullOrWhiteSpace(config.SourceVariable))
        {
            return new BlockExecutionResult($"Parser block '{block.Name}' is missing source variable.", true);
        }

        var sourceKey = config.SourceVariable.TrimStart('$');
        if (!variables.TryGetValue(sourceKey, out var payload) || string.IsNullOrWhiteSpace(payload))
        {
            return new BlockExecutionResult($"Parser block '{block.Name}' could not find variable '{sourceKey}'.", true);
        }

        var mappings = config.Mappings ?? new List<ParserMapping>();
        var assigned = new List<string>();

        if (config.Format == ParserFormat.json)
        {
            try
            {
                using var doc = JsonDocument.Parse(payload);
                foreach (var mapping in mappings)
                {
                    if (string.IsNullOrWhiteSpace(mapping.Path) || string.IsNullOrWhiteSpace(mapping.Variable))
                        continue;
                    var variableName = mapping.Variable.TrimStart('$');
                    var value = ResolveJsonPath(doc.RootElement, mapping.Path);
                    variables[variableName] = value ?? string.Empty;
                    assigned.Add($"{mapping.Path} -> {variableName} = {TruncateValue(value)}");
                }
            }
            catch (Exception ex)
            {
                return new BlockExecutionResult($"JSON parse failed: {ex.Message}", true);
            }
        }
        else
        {
            try
            {
                var xmlDoc = new XPathDocument(new StringReader(payload));
                var nav = xmlDoc.CreateNavigator();
                var ns = new XmlNamespaceManager(nav.NameTable);
                foreach (var mapping in mappings)
                {
                    if (string.IsNullOrWhiteSpace(mapping.Path) || string.IsNullOrWhiteSpace(mapping.Variable))
                        continue;
                    var variableName = mapping.Variable.TrimStart('$');
                    var node = nav.SelectSingleNode(mapping.Path, ns);
                    variables[variableName] = node?.Value ?? string.Empty;
                    assigned.Add($"{mapping.Path} -> {variableName} = {TruncateValue(node?.Value)}");
                }
            }
            catch (Exception ex)
            {
                return new BlockExecutionResult($"XML parse failed: {ex.Message}", true);
            }
        }

        var summary = assigned.Count == 0
            ? "No mappings applied."
            : string.Join(", ", assigned.Take(3));
        if (assigned.Count > 3)
        {
            summary += $" … (+{assigned.Count - 3} more)";
        }

        var description = $"Parsed {assigned.Count} value(s) from {config.Format.ToString().ToUpperInvariant()}: {summary}";
        return new BlockExecutionResult(description, false);
    }

    private static string? ResolveJsonPath(JsonElement root, string path)
    {
        // very small path resolver: supports $.a.b or a.b and simple array indices [0]
        var cleaned = path.Trim();
        if (cleaned.StartsWith("$"))
        {
            cleaned = cleaned.TrimStart('$').TrimStart('.');
        }
        var segments = cleaned.Split('.', StringSplitOptions.RemoveEmptyEntries);
        JsonElement current = root;
        foreach (var seg in segments)
        {
            if (seg.EndsWith("]") && seg.Contains("["))
            {
                var name = seg[..seg.IndexOf('[')];
                var idxStr = seg[(seg.IndexOf('[') + 1)..^1];
                if (!int.TryParse(idxStr, out var idx)) return null;
                if (!string.IsNullOrEmpty(name))
                {
                    if (!current.TryGetProperty(name, out current)) return null;
                }
                if (current.ValueKind != JsonValueKind.Array || current.GetArrayLength() <= idx) return null;
                current = current[idx];
            }
            else
            {
                if (!current.TryGetProperty(seg, out current)) return null;
            }
        }

        return current.ValueKind switch
        {
            JsonValueKind.String => current.GetString(),
            JsonValueKind.Number => current.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            _ => current.GetRawText()
        };
    }

    private static string TruncateValue(string? value, int maxLength = 60)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        return value.Length <= maxLength ? value : value.Substring(0, maxLength) + "…";
    }
}
