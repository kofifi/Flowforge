using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public class WorkflowRevisionService : IWorkflowRevisionService
{
    private readonly IWorkflowRevisionRepository _repository;

    public WorkflowRevisionService(IWorkflowRevisionRepository repository)
    {
        _repository = repository;
    }

    public Task<IEnumerable<WorkflowRevision>> GetAllAsync() => _repository.GetAllAsync();

    public Task<WorkflowRevision?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public Task<WorkflowRevision> CreateAsync(WorkflowRevision revision) => _repository.AddAsync(revision);

    public async Task<bool> UpdateAsync(int id, WorkflowRevision revision)
    {
        if (id != revision.Id)
            return false;
        return await _repository.UpdateAsync(revision);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteAsync(id);
}