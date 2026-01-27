using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Flowforge.Services;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class WorkflowScheduleServiceTests
{
    [Test]
    public async Task CreateAsync_ComputesNextRun()
    {
        var options = new DbContextOptionsBuilder<FlowforgeDbContext>()
            .UseInMemoryDatabase(databaseName: $"schedules-{Guid.NewGuid()}")
            .Options;
        using var context = new FlowforgeDbContext(options);
        context.Workflows.Add(new Workflow { Id = 1, Name = "WF" });
        await context.SaveChangesAsync();

        var repository = new WorkflowScheduleRepository(context);
        var service = new WorkflowScheduleService(repository);

        var schedule = new WorkflowSchedule
        {
            Name = "nightly",
            WorkflowId = 1,
            TriggerType = "Interval",
            StartAtUtc = DateTime.UtcNow.AddMinutes(-10),
            IntervalMinutes = 60,
            IsActive = true
        };

        var created = await service.CreateAsync(schedule);

        Assert.That(created.Id, Is.Not.EqualTo(0));
        Assert.That(created.NextRunAtUtc, Is.Not.Null);
    }
}
