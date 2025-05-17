using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Services;

public interface IWorkflowVariableService
{
    Task<IEnumerable<WorkflowVariable>> GetAllAsync();
    Task<WorkflowVariable?> GetByIdAsync(int id);
    Task<WorkflowVariable> CreateAsync(WorkflowVariable variable);
    Task<bool> UpdateAsync(int id, WorkflowVariable variable);
    Task<bool> DeleteAsync(int id);
}