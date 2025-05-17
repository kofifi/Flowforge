using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public interface IWorkflowRevisionService
{
    Task<IEnumerable<WorkflowRevision>> GetAllAsync();
    Task<WorkflowRevision?> GetByIdAsync(int id);
    Task<WorkflowRevision> CreateAsync(WorkflowRevision revision);
    Task<bool> UpdateAsync(int id, WorkflowRevision revision);
    Task<bool> DeleteAsync(int id);
}