using Flowforge.Models;

namespace Flowforge.NUnit.Models;

public class WorkflowRevisionTests
{
    [Test]
    public void Constructor_ReferenceProperties_AreNullByDefault()
    {
        var revision = new WorkflowRevision();
        Assert.That(revision.Workflow, Is.Null);
    }

    [Test]
    public void Version_DefaultValue_IsEmptyString()
    {
        var revision = new WorkflowRevision();
        Assert.That(revision.Version, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Id_DefaultValue_IsZero()
    {
        var revision = new WorkflowRevision();
        Assert.That(revision.Id, Is.EqualTo(0));
    }

    [Test]
    public void CreatedAt_DefaultValue_IsDateTimeMinValue()
    {
        var revision = new WorkflowRevision();
        Assert.That(revision.CreatedAt, Is.EqualTo(default(DateTime)));
    }
}