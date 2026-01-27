# Pre-prompt
Pisz jak prawdziwy człowiek. Profesjonalnie, naukowo używając dobrej literatury. Poczuj się jak student piszący pracę inżynierską, unikaj buzzword, korpo-języka. Nie brzmij jak notka prasowa. Bądź naturalny i prawdziwy. Nie używaj dużo myślników. Nie lej wody, pisz konkretnie. Brzmij profesjonalnie, nie używaj wyrażeń które brzmią "mądrze" ale często niewiele znaczą albo są bardzo ogólne typu "kluczowe".

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

## Jak pisać pracę inżynierską
- Opieraj się na wymaganiach z poradnika AGH: https://galaxy.agh.edu.pl/~estrzalk/inz.pdf. Traktuj go jako główne źródło formatowania i struktury.
- Struktura: strona tytułowa, oświadczenia, spis treści, wstęp z celem pracy, część teoretyczna (przegląd literatury), część projektowa/badawcza (metody, implementacja, wyniki), podsumowanie z wnioskami i możliwymi usprawnieniami, bibliografia, załączniki.
- Język: oficjalny i precyzyjny, bez kolokwializmów ani marketingowych określeń. Buduj zwięzłe akapity prowadzące czytelnika po logice wywodu.
- Źródła: korzystaj z literatury naukowej, norm i dokumentacji technicznej. Cytuj zgodnie z wytycznymi z poradnika (styl AGH), pamiętaj o spójności zapisów w bibliografii.
- Rysunki i tabele: numeruj, dodawaj podpisy pod elementami, w tekście odnoś się do numerów. Dbaj o czytelne opisy osi i legend.
- Formatowanie: stosuj ujednolicone nagłówki (max. trzy poziomy), wcięcia akapitów, poprawną interlinię i marginesy według pdf. Kod wstawiaj w monospacie z czytelnym łamaniem linii.
- Wyniki i analiza: prezentuj metody, ustawienia eksperymentów, dane wejściowe. Omawiaj wyniki krytycznie, wskazuj ograniczenia.
- Redakcja: po ukończeniu rozdziałów wykonuj korektę merytoryczną i językową; sprawdzaj spójność odwołań, numeracji, list rysunków i tabel.
- Szablon LaTeX: bazuj na poniższym szkielecie (z poradnika, dopasuj do własnych danych). Pamiętaj o pakietach polskich, spisie treści i tytułowej stronie z logotypem uczelni.

```
\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[polish]{babel}
\usepackage{geometry}
\geometry{a4paper, margin=1in}
\usepackage{longtable}
\usepackage{tabularx}
\usepackage{fancyhdr}
\usepackage{listings}
\usepackage{graphicx}
\usepackage{multicol}
\usepackage{adjustbox}
\usepackage{amsmath}
\usepackage{colortbl}
\usepackage{xcolor}
\usepackage{array}
\usepackage{tocloft}
\usepackage{float}
\usepackage{tikz}
\usetikzlibrary{matrix,calc,positioning,shapes.geometric}
\usepackage{pgfplots}
\pgfplotsset{compat=1.17}
\usepackage[hidelinks]{hyperref}
\usepackage{csquotes}

\lstdefinestyle{myStyle}{
    backgroundcolor=\color{white},
    basicstyle=\ttfamily,
    breaklines=true,
    numbers=left,
    numberstyle=\tiny\color{gray},
    keywordstyle=\color{blue},
    commentstyle=\color{green},
    stringstyle=\color{red},
    captionpos=b
}

\begin{document}

\begin{titlepage}
    \centering
    \vspace*{2cm}
    \includegraphics[width=0.5\textwidth]{Uniwersytet_Bielsko-Bialski_-_logo.jpg}\par\vspace{1cm}
    \textsc{\LARGE Uniwersytet Bielsko-Bialski}\par\vspace{1.5cm}
    \textsc{\Large Praca inżynierska}\par\vspace{0.5cm}
    {\huge\bfseries }\par
    \vspace{2cm}
    \begin{flushleft}
        \large
        \textbf{Autor:}\\
        Konrad Firlej\\
        Numer Karty Studenckiej: 60043\\
    \end{flushleft}
    \vspace{1cm}
    \begin{flushleft}
        \large
        \textbf{Promotor:}\\
        dr inż. Krzysztof Augustynek\\
    \end{flushleft}
    \vfill
    {\large 13 czerwca 2025}
\end{titlepage}

\newpage
\tableofcontents
\newpage

\end{document}
```
