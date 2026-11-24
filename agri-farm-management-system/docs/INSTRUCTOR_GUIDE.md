# Instructor Guide — Agri Farm Management System

This guide is for instructors, reviewers, or graders evaluating this
project as a C programming assignment or portfolio piece.

## 1. What This Project Demonstrates

- Structured, modular C11 programming (no globals besides constants; all
  state passed via a `Store` struct pointer).
- Safe string and file handling (`fgets`, bounds-checked `strncpy`,
  atomic save-with-backup file writes).
- Defensive input validation (dates, numeric ranges, enumerations,
  duplicate detection).
- Menu-driven CLI application architecture.
- Unit testing without external frameworks (custom assertion macro).
- Real-world project scaffolding: VS Code integration, build scripts,
  documentation, `.gitignore`.

## 2. How to Evaluate

1. **Build cleanly**: Run `./build.ps1` or the VS Code build task. The
   project must compile with `-std=c11 -Wall -Wextra -Wpedantic -Wshadow
   -Wconversion` and produce **zero warnings**.
2. **Run the tests**: `build/test_agri_farm.exe` should report all
   assertions passing (60+ assertions across validation, CRUD, search,
   save/load, and summary logic).
3. **Run the application**: `build/agri_farm.exe` and walk through each
   menu option:
   - Add a few animals, including one with a duplicate tag (should be
     rejected).
   - View the list.
   - Search by each of the five search modes.
   - Edit a record, confirming and cancelling.
   - Delete a record, confirming it disappears from View but the file
     retains it (`deleted=1`).
   - Check the Summary screen math against the records you entered.
   - Save manually, then inspect `animals.txt` in a text editor.
   - Exit and relaunch to confirm data persists across sessions.

## 3. Grading Rubric Suggestions

| Criterion                         | Weight |
|-----------------------------------|--------|
| Compiles without warnings          | 15%    |
| Correct CRUD behavior              | 25%    |
| Input validation robustness        | 20%    |
| File persistence & safety          | 15%    |
| Test suite coverage & passing      | 15%    |
| Code readability / structure       | 10%    |

## 4. Common Student Pitfalls This Project Avoids

- Using `gets()` or unguarded `scanf("%s", ...)` — this project uses
  `fgets()` exclusively with explicit trimming and overflow handling.
- Losing data on write failure — this project writes to a temp file and
  only renames it into place after a successful write, keeping a `.bak`
  copy of the previous version.
- "Hard" deleting records, which is unrecoverable and hides mistakes —
  this project uses soft delete (`deleted` flag) exclusively.
- Crashing on malformed input — every input path is validated in a loop
  that re-prompts the user rather than trusting the value.

## 5. Extending the Assignment

Instructors wanting to extend this as a multi-week assignment can ask
students to add:
- A "restore deleted animal" feature (unsetting `deleted`).
- CSV export/import.
- A treatment/vaccination history log per animal (a nested array).
- Sorting options for the View screen (by weight, by ID, by tag).
