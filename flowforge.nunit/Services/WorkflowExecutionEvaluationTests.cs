using Flowforge.Models;
using Flowforge.Services;
using Flowforge.Repositories;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
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

    private static Workflow BuildWorkflow()
    {
        var startSb = new SystemBlock { Id = 1, Type = "Start" };
        var endSb = new SystemBlock { Id = 2, Type = "End" };
        var calcSb = new SystemBlock { Id = 3, Type = "Calculation" };

        var workflow = new Workflow { Id = 1, Name = "wf" };

        var start = new Block { Id = 1, Workflow = workflow, WorkflowId = 1, SystemBlock = startSb, SystemBlockId = 1 };
        var calc = new Block { Id = 2, Workflow = workflow, WorkflowId = 1, SystemBlock = calcSb, SystemBlockId = 3,
            JsonConfig = JsonSerializer.Serialize(new CalculationConfig { Operation = CalculationOperation.Add, FirstVariable = "A", SecondVariable = "B", ResultVariable = "C" }) };
        var end = new Block { Id = 3, Workflow = workflow, WorkflowId = 1, SystemBlock = endSb, SystemBlockId = 2 };

        start.SourceConnections.Add(new BlockConnection { SourceBlock = start, TargetBlock = calc });
        calc.SourceConnections.Add(new BlockConnection { SourceBlock = calc, TargetBlock = end });

        workflow.Blocks.Add(start);
        workflow.Blocks.Add(calc);
        workflow.Blocks.Add(end);

        workflow.WorkflowVariables.Add(new WorkflowVariable { Id = 1, Name = "A", DefaultValue = "2", Workflow = workflow, WorkflowId = 1, Type = "number" });
        workflow.WorkflowVariables.Add(new WorkflowVariable { Id = 2, Name = "B", DefaultValue = "3", Workflow = workflow, WorkflowId = 1, Type = "number" });
        workflow.WorkflowVariables.Add(new WorkflowVariable { Id = 3, Name = "C", DefaultValue = "", Workflow = workflow, WorkflowId = 1, Type = "number" });

        return workflow;
    }
}
