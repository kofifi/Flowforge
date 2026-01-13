using System.Text.Json.Serialization;
using Flowforge.Data;
using Flowforge.Models;
using Flowforge.Repositories;
using Flowforge.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Dodawanie serwisów do kontenera DI
builder.Services.AddControllers();

builder.Services.AddDbContext<FlowforgeDbContext>(options => 
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddScoped<IWorkflowRepository, WorkflowRepository>();
builder.Services.AddScoped<IWorkflowService, WorkflowService>();

builder.Services.AddScoped<IBlockRepository, BlockRepository>();
builder.Services.AddScoped<IBlockService, BlockService>();

builder.Services.AddScoped<IWorkflowVariableRepository, WorkflowVariableRepository>();
builder.Services.AddScoped<IWorkflowVariableService, WorkflowVariableService>();

builder.Services.AddScoped<IBlockConnectionRepository, BlockConnectionRepository>();
builder.Services.AddScoped<IBlockConnectionService, BlockConnectionService>();

builder.Services.AddScoped<ISystemBlockRepository, SystemBlockRepository>();
builder.Services.AddScoped<ISystemBlockService, SystemBlockService>();

builder.Services.AddScoped<IBlockExecutor, CalculationBlockExecutor>();
builder.Services.AddScoped<IBlockExecutor, ConditionBlockExecutor>();
builder.Services.AddScoped<IBlockExecutor, SwitchBlockExecutor>();
builder.Services.AddScoped<IBlockExecutor, HttpRequestBlockExecutor>();
builder.Services.AddScoped<IBlockExecutor, ParserBlockExecutor>();
builder.Services.AddScoped<IBlockExecutor, DefaultBlockExecutor>();
builder.Services.AddHttpClient();

builder.Services.AddScoped<IWorkflowExecutionRepository, WorkflowExecutionRepository>();
builder.Services.AddScoped<IWorkflowExecutionService, WorkflowExecutionService>();

builder.Services.AddScoped<IWorkflowRevisionRepository, WorkflowRevisionRepository>();
builder.Services.AddScoped<IWorkflowRevisionService, WorkflowRevisionService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<FlowforgeDbContext>();
    context.Database.Migrate();
    var requiredBlocks = new[]
    {
        new SystemBlock { Type = "Start", Description = "Blok początkowy" },
        new SystemBlock { Type = "End", Description = "Blok końcowy" },
        new SystemBlock { Type = "Calculation", Description = "Blok kalkulacji" },
        new SystemBlock { Type = "If", Description = "Blok warunkowy" },
        new SystemBlock { Type = "Switch", Description = "Blok wielościeżkowy (case)" },
        new SystemBlock { Type = "HttpRequest", Description = "Wywołanie HTTP (GET/POST itp.)" },
        new SystemBlock { Type = "Parser", Description = "Parser JSON/XML" }
    };

    foreach (var block in requiredBlocks)
    {
        if (!context.SystemBlocks.Any(sb => sb.Type == block.Type))
        {
            context.SystemBlocks.Add(block);
        }
    }

    context.SaveChanges();
}

// Konfiguracja pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.MapControllers();
app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();
app.Run();
