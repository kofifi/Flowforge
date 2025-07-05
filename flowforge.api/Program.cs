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
builder.Services.AddScoped<IBlockExecutor, DefaultBlockExecutor>();

builder.Services.AddScoped<IWorkflowExecutionRepository, WorkflowExecutionRepository>();
builder.Services.AddScoped<IWorkflowExecutionService, WorkflowExecutionService>();

builder.Services.AddScoped<IWorkflowRevisionRepository, WorkflowRevisionRepository>();
builder.Services.AddScoped<IWorkflowRevisionService, WorkflowRevisionService>();

var app = builder.Build();

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