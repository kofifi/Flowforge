using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public class WorkflowVariableService : IWorkflowVariableService
{
    private readonly IWorkflowVariableRepository _repository;

    public WorkflowVariableService(IWorkflowVariableRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<WorkflowVariable>> GetAllAsync()
        => await _repository.GetAllAsync();

    public async Task<WorkflowVariable?> GetByIdAsync(int id)
        => await _repository.GetByIdAsync(id);

    public async Task<WorkflowVariable> CreateAsync(WorkflowVariable variable)
        => await _repository.AddAsync(variable);

    public async Task<bool> UpdateAsync(int id, WorkflowVariable variable)
    {
        if (id != variable.Id)
            return false;
        return await _repository.UpdateAsync(variable);
    }

    public async Task<bool> DeleteAsync(int id)
        => await _repository.DeleteAsync(id);
}