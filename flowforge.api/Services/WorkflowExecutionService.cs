using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flowforge.Services;
public class WorkflowExecutionService : IWorkflowExecutionService
{
    private readonly IWorkflowExecutionRepository _repository;

    public WorkflowExecutionService(IWorkflowExecutionRepository repository)
    {
        _repository = repository;
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

    public async Task<WorkflowExecution> EvaluateAsync(Workflow workflow, Dictionary<string, string>? inputs = null)
    {
    var variables = workflow.WorkflowVariables
        .ToDictionary(v => v.Name, v => v.DefaultValue ?? string.Empty);
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
        string description = current.SystemBlock?.Description ?? $"Executed block {name}";


        if (current.SystemBlock?.Type == "Calculation" &&
            !string.IsNullOrEmpty(current.JsonConfig))
        {
            var config = System.Text.Json.JsonSerializer
                .Deserialize<CalculationConfig>(current.JsonConfig!);
            if (config != null)
            {
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
                    _ => ""
                };
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
            }
        }
        else if (current.SystemBlock?.Type == "If" &&
            !string.IsNullOrEmpty(current.JsonConfig))
        {
            var config = System.Text.Json.JsonSerializer
                .Deserialize<ConditionConfig>(current.JsonConfig!);
            if (config != null)
            {
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

                description = $"IF {first} == {second}";
                error = !condition;
            }
        }
        actions.Add(description);

        // Wybierz połączenia w zależności od błędu
        var nextConnections = current.SourceConnections
            ?.Where(c => c.ConnectionType == (error ? ConnectionType.Error : ConnectionType.Success));

        if (nextConnections != null)
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
        Actions = actions

    };

    return await _repository.AddAsync(execution);
}
}