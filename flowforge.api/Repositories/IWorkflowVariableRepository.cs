using Flowforge.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Flowforge.Repositories;

public interface IWorkflowVariableRepository
{
    Task<IEnumerable<WorkflowVariable>> GetAllAsync();
    Task<WorkflowVariable?> GetByIdAsync(int id);
    Task<WorkflowVariable> AddAsync(WorkflowVariable variable);
    Task<bool> UpdateAsync(WorkflowVariable variable);
    Task<bool> DeleteAsync(int id);
}