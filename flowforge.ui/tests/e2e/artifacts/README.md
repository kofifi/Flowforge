Zrzuty ekranu z Playwright
==========================

Struktura katalogów:
- light/ — zrzuty w jasnym motywie
- dark/  — zrzuty w ciemnym motywie

Aktualny zestaw (generowany przez `npm --prefix flowforge.ui run test:e2e`):
- light:
  - workflows.png
  - blocks.png
  - executions.png
  - scheduler.png
  - workflows-actions-01b-more-open.png
  - workflows-actions-02-versions.png
  - workflows-actions-03-rename-form.png
  - workflows-actions-04-import.png
- dark:
  - workflows.png
  - blocks.png
  - executions.png
  - scheduler.png

Zrzuty powstają w testach `tests/e2e/screens.spec.ts` z mockowanym API. Aby odtworzyć:
1) `npm --prefix flowforge.ui run test:e2e`
2) Artefakty pojawią się w katalogach light/ i dark/ jak wyżej.
