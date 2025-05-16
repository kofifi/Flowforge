using Flowforge.Models;

namespace Flowforge.NUnit.Models;

public class WorkflowTests
{
    [Test]
    public void Constructor_InitializesCollections()
    {
        var workflow = new Workflow();

        Assert.That(workflow.Blocks, Is.Not.Null);
        Assert.That(workflow.WorkflowVariables, Is.Not.Null);
        Assert.That(workflow.WorkflowRevisions, Is.Not.Null);
        Assert.That(workflow.WorkflowExecutions, Is.Not.Null);
    }

    [Test]
    public void Name_DefaultValue_IsEmptyString()
    {
        var workflow = new Workflow();
        Assert.That(workflow.Name, Is.EqualTo(string.Empty));
    }
}