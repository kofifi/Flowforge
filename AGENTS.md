# Repository Guidelines

## Project Structure & Module Organization
Flowforge is a .NET + React monorepo organized by subproject:
- `flowforge.api/`: ASP.NET Core Web API (Controllers, Services, Repositories, Models, DTOs). Entity Framework Core migrations live in `flowforge.api/Migrations/`. The local SQLite dev database is `flowforge.api/flowforge.db`.
- `flowforge.nunit/`: NUnit test project covering Controllers, Services, Repositories, and Models. Tests follow the `*Tests.cs` naming pattern.
- `flowforge.ui/`: Vite + React frontend. Source lives in `flowforge.ui/src/`, with static assets in `flowforge.ui/public/`.
- `Flowforge.sln`: solution entry point for .NET builds.

## Build, Test, and Development Commands
- `dotnet build Flowforge.sln`: build API and test projects.
- `dotnet run --project flowforge.api/Flowforge.Api.csproj`: run the API locally.
- `dotnet test flowforge.nunit/Flowforge.NUnit.csproj`: run NUnit test suite.
- `dotnet test flowforge.nunit/Flowforge.NUnit.csproj --collect:"XPlat Code Coverage"`: optional coverage collection.
- `npm --prefix flowforge.ui install`: install frontend dependencies.
- `npm --prefix flowforge.ui run dev`: run the UI with Vite HMR.
- `npm --prefix flowforge.ui run build`: type-check and build the UI.
- `npm --prefix flowforge.ui run lint`: lint the UI with ESLint.

## Coding Style & Naming Conventions
- C#: 4-space indentation, nullable enabled, implicit usings. Use PascalCase for types/methods and camelCase for locals/fields. Keep one public type per file.
- TypeScript/React: 2-space indentation, single quotes, no semicolons (match existing files). Components and files use PascalCase (e.g., `App.tsx`).
- Prefer small, focused services and repositories with interface pairs (`IWorkflowService`, `WorkflowService`).

## Testing Guidelines
- Framework: NUnit with `Microsoft.NET.Test.Sdk`.
- Naming: test files and classes end in `Tests` (e.g., `WorkflowServiceTests`).
- Coverage: no explicit threshold, but new logic should be covered by unit tests in `flowforge.nunit/`.

## Commit & Pull Request Guidelines
- Commit messages use short, imperative sentences (e.g., “Add If block type…”).
- PRs should include a clear summary, linked issues (if any), and test evidence. Include screenshots or screen recordings for UI changes.

## Configuration Tips
- API config lives in `flowforge.api/appsettings.json` and `flowforge.api/appsettings.Development.json`. Keep secrets out of the repo; use environment variables for overrides.
