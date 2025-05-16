using Flowforge.Models;
using Flowforge.Repositories;

namespace Flowforge.Services;

public class WorkflowService : IWorkflowService
{
    private readonly IWorkflowRepository _repository;

    public WorkflowService(IWorkflowRepository repository)
    {
        _repository = repository;
    }

    public Task<List<Workflow>> GetAllAsync()
        => _repository.GetAllAsync();

    public Task<Workflow?> GetByIdAsync(int id)
        => _repository.GetByIdAsync(id);

    public Task<Workflow> CreateAsync(Workflow workflow)
        => _repository.AddAsync(workflow);

    public Task<bool> UpdateAsync(int id, Workflow workflow)
    {
        if (id != workflow.Id)
            return Task.FromResult(false);
        return _repository.UpdateAsync(workflow);
    }

    public Task<bool> DeleteAsync(int id)
        => _repository.DeleteAsync(id);
}