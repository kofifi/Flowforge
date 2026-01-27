using Flowforge.Models;
using Flowforge.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Flowforge.Services;
public class WorkflowExecutionService : IWorkflowExecutionService
{
    private readonly IWorkflowExecutionRepository _repository;
    private readonly IList<IBlockExecutor> _executors;

    public WorkflowExecutionService(IWorkflowExecutionRepository repository, IEnumerable<IBlockExecutor> executors)
    {
        _repository = repository;
        _executors = executors.ToList();
    }

    public async Task<IEnumerable<WorkflowExecution>> GetAllAsync()
        => await _repository.GetAllAsync();

    public async Task<WorkflowExecution?> GetByIdAsync(int id)
        => await _repository.GetByIdAsync(id);

    public async Task<WorkflowExecution> CreateAsync(WorkflowExecution execution)
        => await _repository.AddAsync(execution);

    public async Task<bool> UpdateAsync(int id, WorkflowExecution execution)
    {
        if (id != execution.Id)
            return false;
        return await _repository.UpdateAsync(execution);
    }

    public async Task<bool> DeleteAsync(int id)
        => await _repository.DeleteAsync(id);

    private record LoopConfig(int Iterations);
    private record WaitConfig(int? DelayMs, string? DelayVariable);
    private const int MaxWaitMs = 300_000;

    public async Task<WorkflowExecution> EvaluateAsync(Workflow workflow, Dictionary<string, string>? inputs = null, bool skipWaits = false)
    {
    // Handle duplicate variable names by grouping and taking the last defined value (case-insensitive).
    var variables = workflow.WorkflowVariables
        .GroupBy(v => v.Name ?? string.Empty, StringComparer.OrdinalIgnoreCase)
        .ToDictionary(g => g.Key, g => g.Last().DefaultValue ?? string.Empty, StringComparer.OrdinalIgnoreCase);
    var path = new List<string>();
    var actions = new List<string>();


    if (inputs != null)
    {
        foreach (var (key, value) in inputs)
        {
            variables[key] = value;
        }
    }

    var start = workflow.Blocks.FirstOrDefault(b => b.SystemBlock?.Type == "Start");
    var queue = new Queue<(Flowforge.Models.Block block, HashSet<int> pathVisited)>();

    if (start != null)
        queue.Enqueue((start, new HashSet<int>()));

    while (queue.Count > 0)
    {
        var (current, pathVisited) = queue.Dequeue();
        var error = false;

        // Zapobiegaj cyklom
        if (!pathVisited.Add(current.Id))
            continue;

        var name = string.IsNullOrWhiteSpace(current.Name)
            ? current.SystemBlock?.Type ?? current.Id.ToString()
            : current.Name;
        path.Add(name);
        var executor = _executors.FirstOrDefault(e => e.CanExecute(current));
        executor ??= new DefaultBlockExecutor();
        var result = executor.Execute(current, variables);
        error = result.Error;
        var actionDescription = result.Description;

        // Specjalna logika dla pętli
        if (current.SystemBlock?.Type == "Loop")
        {
            var loopConnections = current.SourceConnections
                ?.Where(c => c.ConnectionType == ConnectionType.Success)
                .ToList() ?? new List<BlockConnection>();
            var exitConnections = current.SourceConnections
                ?.Where(c => c.ConnectionType == ConnectionType.Error)
                .ToList() ?? new List<BlockConnection>();

            var iterations = 1;
            if (!string.IsNullOrWhiteSpace(current.JsonConfig))
            {
                try
                {
                    var config = System.Text.Json.JsonSerializer.Deserialize<LoopConfig>(current.JsonConfig);
                    if (config != null)
                    {
                        iterations = Math.Max(0, config.Iterations);
                    }
                }
                catch
                {
                    // ignore parse errors and use defaults
                }
            }

            iterations = Math.Min(iterations, 1000); // safety cap

            for (var i = 0; i < iterations; i++)
            {
                foreach (var conn in loopConnections)
                {
                    if (conn.TargetBlock != null)
                        queue.Enqueue((conn.TargetBlock, new HashSet<int>(pathVisited)));
                }
            }

            foreach (var conn in exitConnections)
            {
                if (conn.TargetBlock != null)
                    queue.Enqueue((conn.TargetBlock, new HashSet<int>(pathVisited)));
            }

            actions.Add(actionDescription);
            continue;
        }

        if (current.SystemBlock?.Type == "Wait")
        {
            var delay = 0;
            if (!string.IsNullOrWhiteSpace(current.JsonConfig))
            {
                try
                {
                    var cfg = JsonSerializer.Deserialize<WaitConfig>(current.JsonConfig);
                    if (cfg != null)
                    {
                        delay = ResolveWaitDuration(cfg, variables);
                    }
                }
                catch
                {
                    delay = 0;
                }
            }

            if (!skipWaits && delay > 0)
            {
                try
                {
                    await Task.Delay(delay);
                }
                catch
                {
                    // ignore cancellation; proceed
                }
            }

            actionDescription = skipWaits
                ? $"Wait {delay} ms (skipped)"
                : $"Wait {delay} ms";
        }

        actions.Add(actionDescription);

        // Wybierz połączenia w zależności od błędu
        var nextConnections = current.SourceConnections
            ?.Where(c => c.ConnectionType == (error ? ConnectionType.Error : ConnectionType.Success))
            .ToList();

        if (current.SystemBlock?.Type == "Switch" && nextConnections != null)
        {
            var config = string.IsNullOrEmpty(current.JsonConfig)
                ? null
                : System.Text.Json.JsonSerializer.Deserialize<SwitchConfig>(current.JsonConfig);

            var resolved = string.Empty;
            if (config != null && !string.IsNullOrWhiteSpace(config.Expression))
            {
                resolved = config.Expression.StartsWith("$")
                    ? variables.GetValueOrDefault(config.Expression.Substring(1), string.Empty)
                    : config.Expression;
            }

            static string NormalizeSwitchLabel(string? value)
            {
                if (string.IsNullOrWhiteSpace(value)) return string.Empty;
                var trimmed = value.Trim();
                if (trimmed.StartsWith("#", StringComparison.Ordinal))
                {
                    var index = 1;
                    while (index < trimmed.Length && char.IsDigit(trimmed[index]))
                    {
                        index++;
                    }
                    if (index > 1)
                    {
                        if (index < trimmed.Length && trimmed[index] == '·')
                        {
                            index++;
                        }
                        trimmed = trimmed.Substring(index).TrimStart();
                    }
                }
                return trimmed;
            }

            static string ResolveSwitchLabel(string? value, IDictionary<string, string> vars)
            {
                var normalized = NormalizeSwitchLabel(value);
                if (normalized.StartsWith("$", StringComparison.Ordinal))
                {
                    var key = normalized.Substring(1);
                    return vars.TryGetValue(key, out var v) ? v : string.Empty;
                }
                return normalized;
            }

            var resolvedNormalized = ResolveSwitchLabel(resolved, variables);

            var matched = nextConnections.FirstOrDefault(c =>
                !string.IsNullOrWhiteSpace(c.Label) &&
                string.Equals(ResolveSwitchLabel(c.Label, variables), resolvedNormalized, System.StringComparison.OrdinalIgnoreCase));

            var connectionToUse = matched ?? nextConnections.FirstOrDefault(c => string.IsNullOrWhiteSpace(c.Label));

            if (connectionToUse?.TargetBlock != null)
            {
                queue.Enqueue((connectionToUse.TargetBlock, new HashSet<int>(pathVisited)));
            }
        }
        else if (nextConnections != null)
        {
            foreach (var conn in nextConnections)
            {
                if (conn.TargetBlock != null)
                    queue.Enqueue((conn.TargetBlock, new HashSet<int>(pathVisited)));
            }
        }
    }

    var execution = new WorkflowExecution
    {
        ExecutedAt = DateTime.UtcNow,
        WorkflowId = workflow.Id,
        InputData = inputs == null ? null : System.Text.Json.JsonSerializer.Serialize(inputs),
        ResultData = System.Text.Json.JsonSerializer.Serialize(variables),
        Path = path,
        Actions = actions,
        PathData = System.Text.Json.JsonSerializer.Serialize(path),
        ActionsData = System.Text.Json.JsonSerializer.Serialize(actions)

    };

    return await _repository.AddAsync(execution);
}

    private static int ResolveWaitDuration(WaitConfig cfg, IDictionary<string, string> variables)
    {
        static int ParseDelay(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return 0;
            return int.TryParse(value, out var parsed) ? parsed : 0;
        }

        var delay = 0;
        if (!string.IsNullOrWhiteSpace(cfg.DelayVariable))
        {
            var key = cfg.DelayVariable.StartsWith("$", StringComparison.Ordinal)
                ? cfg.DelayVariable.Substring(1)
                : cfg.DelayVariable;
            if (variables.TryGetValue(key, out var variableValue))
            {
                delay = ParseDelay(variableValue);
            }
        }

        if (delay <= 0 && cfg.DelayMs.HasValue)
        {
            delay = cfg.DelayMs.Value;
        }

        delay = Math.Max(0, delay);
        delay = Math.Min(delay, MaxWaitMs);
        return delay;
    }
}
