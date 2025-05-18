using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public interface IWorkflowRevisionRepository
{
    // CRUD operations for WorkflowRevision
    Task<IEnumerable<WorkflowRevision>> GetAllAsync();
    Task<WorkflowRevision?> GetByIdAsync(int id);
    Task<WorkflowRevision> AddAsync(WorkflowRevision revision);
    Task<bool> UpdateAsync(WorkflowRevision revision);
    Task<bool> DeleteAsync(int id);
    
    // Additional methods for WorkflowRevision
    Task<WorkflowRevision?> GetLatestByWorkflowIdAsync(int workflowId);
}