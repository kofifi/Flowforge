using Flowforge.Models;

namespace Flowforge.Services;

public interface IWorkflowScheduleService
{
    Task<IEnumerable<WorkflowSchedule>> GetAllAsync();
    Task<IEnumerable<WorkflowSchedule>> GetByWorkflowAsync(int workflowId);
    Task<IEnumerable<WorkflowSchedule>> GetDueAsync(DateTime asOfUtc);
    Task<WorkflowSchedule?> GetByIdAsync(int id);
    Task<WorkflowSchedule> CreateAsync(WorkflowSchedule schedule);
    Task<bool> UpdateAsync(int id, WorkflowSchedule schedule);
    Task<bool> DeleteAsync(int id);
}
