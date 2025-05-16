using Flowforge.Models;

namespace Flowforge.NUnit.Models;

public class BlockConnectionTests
{
    [Test]
    public void Constructor_ReferenceProperties_AreNullByDefault()
    {
        var connection = new BlockConnection();
        Assert.That(connection.SourceBlock, Is.Null);
        Assert.That(connection.TargetBlock, Is.Null);
    }

    [Test]
    public void Id_DefaultValue_IsZero()
    {
        var blockConnection = new BlockConnection();
        Assert.That(blockConnection.Id, Is.EqualTo(0));
    }
}