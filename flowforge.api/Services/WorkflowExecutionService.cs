using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Linq;
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
        var executor = _executors.FirstOrDefault(e => e.CanExecute(current));
        executor ??= new DefaultBlockExecutor();
        var result = executor.Execute(current, variables);
        error = result.Error;
        actions.Add(result.Description);

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