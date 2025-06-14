using Flowforge.Models;
using NUnit.Framework;

namespace Flowforge.NUnit.Models;

public class CalculationConfigTests
{
    [Test]
    public void Constructor_SetsDefaultValues()
    {
        var config = new CalculationConfig();

        Assert.That(config.Operation, Is.EqualTo(CalculationOperation.Add));
        Assert.That(config.FirstVariable, Is.EqualTo(string.Empty));
        Assert.That(config.SecondVariable, Is.EqualTo(string.Empty));
        Assert.That(config.ResultVariable, Is.EqualTo(string.Empty));
    }
}
