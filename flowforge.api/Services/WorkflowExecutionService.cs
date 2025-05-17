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
}