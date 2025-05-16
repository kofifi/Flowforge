namespace Flowforge.Repositories;
using Flowforge.Models;

public interface IWorkflowRepository
{
    Task<List<Workflow>> GetAllAsync();
    Task<Workflow?> GetByIdAsync(int id);
    Task<Workflow> AddAsync(Workflow workflow);
    Task<bool> UpdateAsync(Workflow workflow);
    Task<bool> DeleteAsync(int id);
}