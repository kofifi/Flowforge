using Flowforge.Models;

namespace Flowforge.NUnit.Models;

public class BlockTests
{
    [Test]
    public void Constructor_InitializesCollections()
    {
        var block = new Block();

        Assert.That(block.SourceConnections, Is.Not.Null);
        Assert.That(block.TargetConnections, Is.Not.Null);
    }

    [Test]
    public void Name_DefaultValue_IsEmptyString()
    {
        var block = new Block();
        Assert.That(block.Name, Is.EqualTo(string.Empty));
    }
}