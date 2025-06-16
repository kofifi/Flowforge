using Flowforge.Models;
using Flowforge.Services;
using Flowforge.Repositories;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace Flowforge.NUnit.Services;

[TestFixture]
public class WorkflowExecutionEvaluationTests
{
    private Mock<IWorkflowExecutionRepository> _repoMock = null!;
    private WorkflowExecutionService _service = null!;

    [SetUp]
    public void Setup()
    {
        _repoMock = new Mock<IWorkflowExecutionRepository>();
        _repoMock.Setup(r => r.AddAsync(It.IsAny<WorkflowExecution>()))
            .ReturnsAsync((WorkflowExecution e) => e);
        _service = new WorkflowExecutionService(_repoMock.Object);
    }

    [Test]
    public async Task EvaluateAsync_ComputesCalculation()
    {
        var workflow = BuildWorkflow();

        var result = await _service.EvaluateAsync(workflow);

        _repoMock.Verify(r => r.AddAsync(It.IsAny<WorkflowExecution>()), Times.Once);
        Assert.That(result.ResultData, Is.Not.Null);
        var vars = JsonSerializer.Deserialize<Dictionary<string,string>>(result.ResultData!);
        Assert.That(vars!["C"], Is.EqualTo("5"));
    }

    [Test]
    public async Task EvaluateAsync_UsesInputOverrides()
    {
        var workflow = BuildWorkflow();
        var inputs = new Dictionary<string, string> { ["A"] = "4", ["B"] = "6" };

        var result = await _service.EvaluateAsync(workflow, inputs);

        _repoMock.Verify(r => r.AddAsync(It.IsAny<WorkflowExecution>()), Times.Once);
        Assert.That(result.InputData, Is.Not.Null);
        var inputVars = JsonSerializer.Deserialize<Dictionary<string,string>>(result.InputData!);
        Assert.That(inputVars!["A"], Is.EqualTo("4"));

        var vars = JsonSerializer.Deserialize<Dictionary<string,string>>(result.ResultData!);
        Assert.That(vars!["C"], Is.EqualTo("10"));
    }

    [TestCase(CalculationOperation.Add, "2", "3", "5")]
    [TestCase(CalculationOperation.Subtract, "5", "2", "3")]
    [TestCase(CalculationOperation.Multiply, "2", "3", "6")]
    [TestCase(CalculationOperation.Divide, "6", "3", "2")]
    [TestCase(CalculationOperation.Concat, "a", "b", "ab")]
    public async Task EvaluateAsync_PerformsOperations(CalculationOperation op, string first, string second, string expected)
    {
        var workflow = BuildWorkflow(op, first, second);

        var result = await _service.EvaluateAsync(workflow);

        var vars = JsonSerializer.Deserialize<Dictionary<string,string>>(result.ResultData!);
        Assert.That(vars!["C"], Is.EqualTo(expected));
    }

    [Test]
    public async Task EvaluateAsync_StoresResultInFirstVariable_WhenResultVariableEmpty()
    {
        var workflow = BuildWorkflow(CalculationOperation.Add, "1", "2", string.Empty);

        var result = await _service.EvaluateAsync(workflow);

        var vars = JsonSerializer.Deserialize<Dictionary<string,string>>(result.ResultData!);
        Assert.That(vars!["A"], Is.EqualTo("3"));
    }

    [Test]
    public async Task EvaluateAsync_ReturnsDefaults_WhenNoStartBlock()
    {
        var workflow = BuildWorkflow(includeStart: false);

        var result = await _service.EvaluateAsync(workflow);

        var vars = JsonSerializer.Deserialize<Dictionary<string,string>>(result.ResultData!);
        Assert.Multiple(() =>
        {
            Assert.That(vars!["A"], Is.EqualTo("2"));
            Assert.That(vars!["B"], Is.EqualTo("3"));
            Assert.That(vars!["C"], Is.EqualTo(string.Empty));
        });
    }

    [Test]
    public async Task EvaluateAsync_IfBlock_TruePath()
    {
        var workflow = BuildIfWorkflow(true);

        var result = await _service.EvaluateAsync(workflow);

        Assert.That(result.Path, Is.Not.Null);
        Assert.That(result.Path!.Last(), Is.EqualTo("EndTrue"));
    }

    [Test]
    public async Task EvaluateAsync_IfBlock_FalsePath()
    {
        var workflow = BuildIfWorkflow(false);

        var result = await _service.EvaluateAsync(workflow);

        Assert.That(result.Path, Is.Not.Null);
        Assert.That(result.Path!.Last(), Is.EqualTo("EndFalse"));
    }

    private static Workflow BuildWorkflow(
        CalculationOperation operation = CalculationOperation.Add,
        string firstDefault = "2",
        string secondDefault = "3",
        string? resultVariable = "C",
        bool includeStart = true)
    {
        var startSb = new SystemBlock { Id = 1, Type = "Start" };
        var endSb = new SystemBlock { Id = 2, Type = "End" };
        var calcSb = new SystemBlock { Id = 3, Type = "Calculation" };

        var workflow = new Workflow { Id = 1, Name = "wf" };

        var start = new Block { Id = 1, Workflow = workflow, WorkflowId = 1, SystemBlock = startSb, SystemBlockId = 1 };
        var calc = new Block
        {
            Id = 2,
            Workflow = workflow,
            WorkflowId = 1,
            SystemBlock = calcSb,
            SystemBlockId = 3,
            JsonConfig = JsonSerializer.Serialize(new CalculationConfig
            {
                Operation = operation,
                FirstVariable = "A",
                SecondVariable = "B",
                ResultVariable = resultVariable ?? string.Empty
            })
        };
        var end = new Block { Id = 3, Workflow = workflow, WorkflowId = 1, SystemBlock = endSb, SystemBlockId = 2 };

        if (includeStart)
            start.SourceConnections.Add(new BlockConnection { SourceBlock = start, TargetBlock = calc });
        calc.SourceConnections.Add(new BlockConnection { SourceBlock = calc, TargetBlock = end });

        if (includeStart)
            workflow.Blocks.Add(start);
        workflow.Blocks.Add(calc);
        workflow.Blocks.Add(end);

        workflow.WorkflowVariables.Add(new WorkflowVariable { Id = 1, Name = "A", DefaultValue = firstDefault, Workflow = workflow, WorkflowId = 1 });
        workflow.WorkflowVariables.Add(new WorkflowVariable { Id = 2, Name = "B", DefaultValue = secondDefault, Workflow = workflow, WorkflowId = 1 });
        workflow.WorkflowVariables.Add(new WorkflowVariable { Id = 3, Name = "C", DefaultValue = string.Empty, Workflow = workflow, WorkflowId = 1 });

        return workflow;
    }

    private static Workflow BuildIfWorkflow(bool equal)
    {
        var startSb = new SystemBlock { Id = 1, Type = "Start" };
        var endSbT = new SystemBlock { Id = 2, Type = "End" };
        var endSbF = new SystemBlock { Id = 3, Type = "End" };
        var ifSb = new SystemBlock { Id = 4, Type = "If" };

        var workflow = new Workflow { Id = 1, Name = "wf" };

        var start = new Block { Id = 1, Workflow = workflow, WorkflowId = 1, SystemBlock = startSb, SystemBlockId = 1 };
        var ifBlock = new Block
        {
            Id = 2,
            Workflow = workflow,
            WorkflowId = 1,
            SystemBlock = ifSb,
            SystemBlockId = 4,
            JsonConfig = JsonSerializer.Serialize(new ConditionConfig
            {
                DataType = ConditionDataType.Number,
                First = "$A",
                Second = equal ? "$B" : "10"
            })
        };
        var endTrue = new Block { Id = 3, Workflow = workflow, WorkflowId = 1, SystemBlock = endSbT, SystemBlockId = 2, Name = "EndTrue" };
        var endFalse = new Block { Id = 4, Workflow = workflow, WorkflowId = 1, SystemBlock = endSbF, SystemBlockId = 3, Name = "EndFalse" };

        start.SourceConnections.Add(new BlockConnection { SourceBlock = start, TargetBlock = ifBlock });
        ifBlock.SourceConnections.Add(new BlockConnection { SourceBlock = ifBlock, TargetBlock = endTrue, ConnectionType = ConnectionType.Success });
        ifBlock.SourceConnections.Add(new BlockConnection { SourceBlock = ifBlock, TargetBlock = endFalse, ConnectionType = ConnectionType.Error });

        workflow.Blocks.Add(start);
        workflow.Blocks.Add(ifBlock);
        workflow.Blocks.Add(endTrue);
        workflow.Blocks.Add(endFalse);

        workflow.WorkflowVariables.Add(new WorkflowVariable { Id = 1, Name = "A", DefaultValue = "5", Workflow = workflow, WorkflowId = 1 });
        workflow.WorkflowVariables.Add(new WorkflowVariable { Id = 2, Name = "B", DefaultValue = equal ? "5" : "3", Workflow = workflow, WorkflowId = 1 });

        return workflow;
    }
}
