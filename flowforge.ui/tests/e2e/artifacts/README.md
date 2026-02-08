Zrzuty ekranu i prezentacje (Playwright)
========================================

Co tu jest
----------
- `light/` i `dark/` – pełny zestaw zrzutów w jasnym i ciemnym motywie (parytet nazw).
- `presentation-light.tex/.pdf` oraz `presentation-dark.tex/.pdf` – gotowe slidedecki zrobione na bazie zrzutów.
- `presentation.tex` – wariant łączony (oba motywy), jeżeli potrzebny jeden plik.
- `Uniwersytet_Bielsko-Bialski_-_logo.jpg` – logo uczelni użyte na stronie tytułowej.

Jak odtworzyć zrzuty
--------------------
1. Uruchom podgląd UI:  
   `npm --prefix flowforge.ui run preview -- --host 127.0.0.1 --port 4174`
2. W drugim terminalu odpal Playwright (Firefox):  
   `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174 npx --prefix flowforge.ui playwright test --config=playwright.config.ts --project=firefox`
3. Nowe PNG wpadną do `tests/e2e/artifacts/light/` i `tests/e2e/artifacts/dark/`.

Jak zbudować PDF
----------------
W katalogu `tests/e2e/artifacts/`:  
`latexmk -pdf presentation-light.tex`  
`latexmk -pdf presentation-dark.tex`

Najważniejsze pliki PNG (light/dark)
------------------------------------
- Widoki główne: `workflows*.png`, `blocks*.png`, `executions*.png`, `scheduler*.png`
- Akcje na workflow: `workflows-actions-*`
- Konfiguracja bloków: `workflow-editor-config-*.png`
- Edytor: `workflow-editor*.png`, `workflow-editor-add-blocks.png`, `workflow-editor-variables*.png`
- Run drawer: `run-drawer-open.png`, `run-drawer-result.png`
- Execution details: `execution-details.png`
- Scheduler create/edit: `scheduler-actions-01-create.png`, `scheduler-actions-02-edit.png`
