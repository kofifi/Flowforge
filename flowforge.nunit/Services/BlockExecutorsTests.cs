using System.Collections.Generic;
using Flowforge.Models;
using Flowforge.Services;
using NUnit.Framework;
using Moq;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class BlockExecutorsTests
{
    [Test]
    public void Calculation_AddsNumbersAndStoresResult()
    {
        var block = new Block
        {
            Name = "Calc",
            SystemBlock = new SystemBlock { Type = "Calculation" },
            JsonConfig = """
            {
              "Operation": "Add",
              "FirstVariable": "a",
              "SecondVariable": "b",
              "ResultVariable": "sum"
            }
            """
        };
        var vars = new Dictionary<string, string> { ["a"] = "2.5", ["b"] = "3.5" };
        var executor = new CalculationBlockExecutor();

        Assert.That(executor.CanExecute(block), Is.True);
        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(vars["sum"], Is.EqualTo("6"));
    }

    [Test]
    public void Calculation_DivideByZero_KeepsFirstOperand()
    {
        var block = new Block
        {
            SystemBlock = new SystemBlock { Type = "Calculation" },
            JsonConfig = """{ "Operation": "Divide", "FirstVariable": "a", "SecondVariable": "b", "ResultVariable": "res" }"""
        };
        var vars = new Dictionary<string, string> { ["a"] = "5", ["b"] = "0" };
        var executor = new CalculationBlockExecutor();

        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(vars["res"], Is.EqualTo("5"));
    }

    [Test]
    public void Condition_ComparesNumbers_ReturnsErrorWhenFalse()
    {
        var block = new Block
        {
            SystemBlock = new SystemBlock { Type = "If" },
            JsonConfig = """{ "First": "$x", "Second": "10", "DataType": 1 }"""
        };
        var vars = new Dictionary<string, string> { ["x"] = "5" };
        var executor = new ConditionBlockExecutor();

        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.True);
        Assert.That(result.Description, Does.Contain("IF"));
    }

    [Test]
    public void TextReplace_AppliesRegexAndStoresInVariable()
    {
        var block = new Block
        {
            SystemBlock = new SystemBlock { Type = "TextReplace" },
            JsonConfig = """
            {
              "InputVariable": "txt",
              "ResultVariable": "out",
              "Replacements": [
                { "From": "\\\\d+", "To": "#", "UseRegex": true, "IgnoreCase": true },
                { "From": "hello", "To": "hi", "UseRegex": false, "IgnoreCase": true }
              ]
            }
            """
        };
        var vars = new Dictionary<string, string> { ["txt"] = "Hello 123" };
        var executor = new TextReplaceBlockExecutor();

        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(vars["out"], Is.EqualTo("hi 123"));
    }

    [Test]
    public void TextTransform_UppercasesAndTrims()
    {
        var block = new Block
        {
            SystemBlock = new SystemBlock { Type = "TextTransform" },
            JsonConfig = """{ "Input": "  Abc  ", "Operation": "Upper", "ResultVariable": "res" }"""
        };
        var vars = new Dictionary<string, string>();
        var executor = new TextTransformBlockExecutor();

        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(vars["res"], Is.EqualTo("  ABC  "));
    }

    [Test]
    public void Parser_ExtractsJsonPath()
    {
        var block = new Block
        {
            SystemBlock = new SystemBlock { Type = "Parser" },
            JsonConfig = """{ "Format": "json", "SourceVariable": "$payload", "Mappings": [ { "Path": "$.user.name", "Variable": "$username" } ] }"""
        };
        var vars = new Dictionary<string, string> { ["payload"] = """{"user":{"name":"Ada"}}""" };
        var executor = new ParserBlockExecutor();

        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(vars["username"], Is.EqualTo("Ada"));
    }

    [Test]
    public void Parser_ExtractsXml()
    {
        var block = new Block
        {
            SystemBlock = new SystemBlock { Type = "Parser" },
            JsonConfig = """{ "Format": "xml", "SourceVariable": "$payload", "Mappings": [ { "Path": "/root/item", "Variable": "$value" } ] }"""
        };
        var vars = new Dictionary<string, string> { ["payload"] = "<root><item>42</item></root>" };
        var executor = new ParserBlockExecutor();

        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(vars["value"], Is.EqualTo("42"));
    }

    private class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly HttpResponseMessage _response;
        public StubHttpMessageHandler(HttpResponseMessage response) => _response = response;
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(_response);
    }

    [Test]
    public void HttpRequest_SetsResponseVariables()
    {
        var response = new HttpResponseMessage(System.Net.HttpStatusCode.Created)
        {
            Content = new StringContent("ok")
        };
        var handler = new StubHttpMessageHandler(response);
        var client = new HttpClient(handler);
        var factoryMock = new Mock<IHttpClientFactory>();
        factoryMock.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(client);

        var block = new Block
        {
            SystemBlock = new SystemBlock { Type = "HttpRequest" },
            JsonConfig = """{ "Url": "http://example.com", "Method": "POST", "Body": "{}", "ResponseVariable": "resp" }"""
        };
        var vars = new Dictionary<string, string>();
        var executor = new HttpRequestBlockExecutor(factoryMock.Object);

        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(vars["http.status"], Is.EqualTo("201"));
        Assert.That(vars["http.body"], Is.EqualTo("ok"));
        Assert.That(vars["resp"], Is.EqualTo("ok"));
    }

    [Test]
    public void Switch_EvaluatesExpressionFromVariable()
    {
        var block = new Block
        {
            SystemBlock = new SystemBlock { Type = "Switch" },
            JsonConfig = """{ "Expression": "$mode" }"""
        };
        var vars = new Dictionary<string, string> { ["mode"] = "green" };
        var executor = new SwitchBlockExecutor();

        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(result.Description, Does.Contain("green"));
    }

    [Test]
    public void DefaultExecutor_UsesNameWhenProvided()
    {
        var block = new Block
        {
            Name = "Custom",
            SystemBlock = new SystemBlock { Type = "CustomType", Description = "desc" }
        };
        var vars = new Dictionary<string, string>();
        var executor = new DefaultBlockExecutor();

        Assert.That(executor.CanExecute(block), Is.True);
        var result = executor.Execute(block, vars);

        Assert.That(result.Error, Is.False);
        Assert.That(result.Description, Is.EqualTo("desc"));
    }
}
