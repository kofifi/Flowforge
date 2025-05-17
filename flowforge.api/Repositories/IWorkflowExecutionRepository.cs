using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public interface IWorkflowExecutionRepository
{
    Task<IEnumerable<WorkflowExecution>> GetAllAsync();
    Task<WorkflowExecution?> GetByIdAsync(int id);
    Task<WorkflowExecution> AddAsync(WorkflowExecution execution);
    Task<bool> UpdateAsync(WorkflowExecution execution);
    Task<bool> DeleteAsync(int id);
}