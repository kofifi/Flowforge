using Flowforge.Models;

namespace Flowforge.Repositories;

public interface IWorkflowScheduleRepository
{
    Task<IEnumerable<WorkflowSchedule>> GetAllAsync();
    Task<IEnumerable<WorkflowSchedule>> GetByWorkflowAsync(int workflowId);
    Task<IEnumerable<WorkflowSchedule>> GetDueAsync(DateTime asOfUtc);
    Task<WorkflowSchedule?> GetByIdAsync(int id);
    Task<WorkflowSchedule> AddAsync(WorkflowSchedule schedule);
    Task<bool> UpdateAsync(WorkflowSchedule schedule);
    Task<bool> DeleteAsync(int id);
}
