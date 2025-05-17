using Flowforge.Models;
using NUnit.Framework;

namespace Flowforge.NUnit.Models;

public class SystemBlockTests
{
    [Test]
    public void Constructor_InitializesCollections()
    {
        var systemBlock = new SystemBlock();

        Assert.That(systemBlock.Blocks, Is.Not.Null);
    }

    [Test]
    public void Type_DefaultValue_IsEmptyString()
    {
        var systemBlock = new SystemBlock();
        Assert.That(systemBlock.Type, Is.EqualTo(string.Empty));
    }

    [Test]
    public void Description_DefaultValue_IsEmptyString()
    {
        var systemBlock = new SystemBlock();
        Assert.That(systemBlock.Description, Is.EqualTo(string.Empty));
    }
}