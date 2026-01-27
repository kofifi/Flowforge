using Flowforge.Data;
using Flowforge.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Flowforge.Services;

public class WorkflowSchedulerHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TimeSpan _pollInterval = TimeSpan.FromSeconds(30);

    public WorkflowSchedulerHostedService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await TickAsync(stoppingToken);
            try
            {
                await Task.Delay(_pollInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // ignore
            }
        }
    }

    private async Task TickAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var scheduleService = scope.ServiceProvider.GetRequiredService<IWorkflowScheduleService>();
        var executionService = scope.ServiceProvider.GetRequiredService<IWorkflowExecutionService>();
        var context = scope.ServiceProvider.GetRequiredService<FlowforgeDbContext>();

        var now = DateTime.UtcNow;
        var due = await scheduleService.GetDueAsync(now);

        foreach (var schedule in due)
        {
            var workflow = await context.Workflows
                .Include(w => w.Blocks).ThenInclude(b => b.SystemBlock)
                .Include(w => w.Blocks).ThenInclude(b => b.SourceConnections).ThenInclude(c => c.TargetBlock).ThenInclude(tb => tb.SystemBlock)
                .Include(w => w.WorkflowVariables)
                .FirstOrDefaultAsync(w => w.Id == schedule.WorkflowId, cancellationToken);

            if (workflow == null)
            {
                schedule.IsActive = false;
                schedule.NextRunAtUtc = null;
                continue;
            }

            await executionService.EvaluateAsync(workflow, null, skipWaits: true);

            schedule.LastRunAtUtc = now;
            if (schedule.TriggerType.Equals("once", StringComparison.OrdinalIgnoreCase) ||
                !schedule.IntervalMinutes.HasValue ||
                schedule.IntervalMinutes.Value <= 0)
            {
                schedule.IsActive = false;
                schedule.NextRunAtUtc = null;
            }
            else
            {
                schedule.NextRunAtUtc = now.AddMinutes(Math.Max(1, schedule.IntervalMinutes.Value));
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
