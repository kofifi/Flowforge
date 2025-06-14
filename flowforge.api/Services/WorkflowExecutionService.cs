using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
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

    public async Task<WorkflowExecution> EvaluateAsync(Workflow workflow)
    {
        var variables = workflow.WorkflowVariables
            .ToDictionary(v => v.Name, v => v.DefaultValue ?? string.Empty);

        var current = workflow.Blocks
            .FirstOrDefault(b => b.SystemBlock?.Type == "Start");
        var visited = new HashSet<int>();

        while (current != null && current.SystemBlock?.Type != "End")
        {
            if (!visited.Add(current.Id))
                break;

            if (current.SystemBlock?.Type == "Calculation" &&
                !string.IsNullOrEmpty(current.JsonConfig))
            {
                var config = System.Text.Json.JsonSerializer
                    .Deserialize<CalculationConfig>(current.JsonConfig!);
                if (config != null)
                {
                    variables.TryGetValue(config.FirstVariable, out var first);
                    variables.TryGetValue(config.SecondVariable, out var second);

                    switch (config.Operation)
                    {
                        case CalculationOperation.Concat:
                            variables[config.FirstVariable] = (first ?? string.Empty) + (second ?? string.Empty);
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
                            variables[config.FirstVariable] = result.ToString();
                            break;
                    }
                }
            }

            var next = current.SourceConnections.FirstOrDefault();
            current = next?.TargetBlock;
        }

        var execution = new WorkflowExecution
        {
            ExecutedAt = DateTime.UtcNow,
            WorkflowId = workflow.Id,
            ResultData = System.Text.Json.JsonSerializer.Serialize(variables)
        };

        return await _repository.AddAsync(execution);
    }
}