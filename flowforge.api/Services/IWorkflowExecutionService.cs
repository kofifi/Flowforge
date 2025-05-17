using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public interface IWorkflowExecutionService
{
    Task<IEnumerable<WorkflowExecution>> GetAllAsync();
    Task<WorkflowExecution?> GetByIdAsync(int id);
    Task<WorkflowExecution> CreateAsync(WorkflowExecution execution);
    Task<bool> UpdateAsync(int id, WorkflowExecution execution);
    Task<bool> DeleteAsync(int id);
}