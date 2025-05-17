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

builder.Services.AddScoped<IWorkflowRepository, WorkflowRepository>();
builder.Services.AddScoped<WorkflowService, WorkflowService>();

builder.Services.AddScoped<IBlockRepository, BlockRepository>();
builder.Services.AddScoped<WorkflowService, WorkflowService>();

builder.Services.AddScoped<IWorkflowVariableRepository, WorkflowVariableRepository>();
builder.Services.AddScoped<IWorkflowVariableService, WorkflowVariableService>();

var app = builder.Build();

// Konfiguracja pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();
app.Run();