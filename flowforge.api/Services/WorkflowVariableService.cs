using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public class WorkflowVariableService : IWorkflowVariableService
{
    private readonly IWorkflowVariableRepository _repository;
    private readonly IWorkflowRepository _workflowRepository;

    public WorkflowVariableService(
        IWorkflowVariableRepository repository,
        IWorkflowRepository workflowRepository)
    {
        _repository = repository;
        _workflowRepository = workflowRepository;
    }

    public async Task<IEnumerable<WorkflowVariable>> GetAllAsync()
        => await _repository.GetAllAsync();

    public async Task<WorkflowVariable?> GetByIdAsync(int id)
        => await _repository.GetByIdAsync(id);

    public async Task<WorkflowVariable> CreateAsync(WorkflowVariable variable)
    {
        // Pobierz istniejący workflow po ID
        var workflow = await _workflowRepository.GetByIdAsync(variable.WorkflowId);
        if (workflow == null)
            throw new KeyNotFoundException("Workflow not found");

        variable.Workflow = workflow;
        return await _repository.AddAsync(variable);
    }

    public async Task<bool> UpdateAsync(int id, WorkflowVariable variable)
    {
        if (id != variable.Id)
            return false;

        // Pobierz istniejący workflow po ID
        var workflow = await _workflowRepository.GetByIdAsync(variable.WorkflowId);
        if (workflow == null)
            return false;

        variable.Workflow = workflow;
        return await _repository.UpdateAsync(variable);
    }

    public async Task<bool> DeleteAsync(int id)
        => await _repository.DeleteAsync(id);
}