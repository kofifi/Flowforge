using Flowforge.Models;

namespace Flowforge.NUnit.Models;

public class WorkflowVariableTests
{
    [Test]
    public void Constructor_ReferenceProperties_AreNullByDefault()
    {
        var variable = new WorkflowVariable();
        Assert.That(variable.Workflow, Is.Null);
    }

    [Test]
    public void Name_DefaultValue_IsEmptyString()
    {
        var variable = new WorkflowVariable();
        Assert.That(variable.Name, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Type_DefaultValue_IsString()
    {
        var variable = new WorkflowVariable();
        Assert.That(variable.Type, Is.EqualTo(WorkflowVariableType.String));
    }

    [Test]
    public void DefaultValue_Default_IsNull()
    {
        var variable = new WorkflowVariable();
        Assert.That(variable.DefaultValue, Is.Null);
    }

    [Test]
    public void Id_DefaultValue_IsZero()
    {
        var variable = new WorkflowVariable();
        Assert.That(variable.Id, Is.EqualTo(0));
    }
}