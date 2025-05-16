namespace Flowforge.Services;
using Flowforge.Models;

public interface IWorkflowService
{
    Task<List<Workflow>> GetAllAsync();
    Task<Workflow?> GetByIdAsync(int id);
    Task<Workflow> CreateAsync(Workflow workflow);
    Task<bool> UpdateAsync(int id, Workflow workflow);
    Task<bool> DeleteAsync(int id);
}