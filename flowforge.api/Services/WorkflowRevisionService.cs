using Flowforge.Models;
using Flowforge.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public class WorkflowRevisionService : IWorkflowRevisionService
{
    private readonly IWorkflowRevisionRepository _repository;
    private readonly IWorkflowRepository _workflowRepository;

    public WorkflowRevisionService(
        IWorkflowRevisionRepository repository,
        IWorkflowRepository workflowRepository)
    {
        _repository = repository;
        _workflowRepository = workflowRepository;
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

    public Task<WorkflowRevision?> GetLatestByWorkflowIdAsync(int workflowId)
    {
        return _repository.GetLatestByWorkflowIdAsync(workflowId);
    }

    public async Task<bool> RollbackToRevisionAsync(int workflowId, int revisionId)
    {
        var revision = await _repository.GetByIdAsync(revisionId);
        if (revision == null || revision.WorkflowId != workflowId)
            return false;

        var workflow = await _workflowRepository.GetByIdAsync(workflowId);
        if (workflow == null)
            return false;

        workflow.Name = revision.Version;
        var updated = await _workflowRepository.UpdateAsync(workflow);
        return updated;
    }
}