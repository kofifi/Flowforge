using Flowforge.Models;

namespace Flowforge.NUnit.Models;

public class WorkflowExecutionTests
{
    [Test]
    public void Constructor_ReferenceProperties_AreNullByDefault()
    {
        var execution = new WorkflowExecution();
        Assert.That(execution.Workflow, Is.Null);
    }

    [Test]
    public void Id_DefaultValue_IsZero()
    {
        var execution = new WorkflowExecution();
        Assert.That(execution.Id, Is.EqualTo(0));
    }

    [Test]
    public void ExecutedAt_DefaultValue_IsDateTimeMinValue()
    {
        var execution = new WorkflowExecution();
        Assert.That(execution.ExecutedAt, Is.EqualTo(default(DateTime)));
    }

    [Test]
    public void InputData_DefaultValue_IsNull()
    {
        var execution = new WorkflowExecution();
        Assert.That(execution.InputData, Is.Null);
    }

    [Test]
    public void ResultData_DefaultValue_IsNull()
    {
        var execution = new WorkflowExecution();
        Assert.That(execution.ResultData, Is.Null);
    }
}