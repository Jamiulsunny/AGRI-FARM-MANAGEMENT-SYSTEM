# AGRI FARM MANAGEMENT SYSTEM

A professional, console-based (CLI) livestock management system written in
strict **C11**, built for Windows with **MinGW GCC** and ready to run
directly inside **VS Code**.

## Project Description

Agri Farm Management System helps a farmer keep track of every animal on
the farm — birth details, breed, gender, weight, and health status — using
a fast, dependency-free, file-backed database. No external libraries, no
SQL server: just a single compiled executable and a plain text data file.

## Features

| # | Feature            | Description                                                      |
|---|---------------------|-------------------------------------------------------------------|
| 1 | Add Animal          | Create a new record with full validation and a unique ID.        |
| 2 | View All Animals    | List all active records in a formatted table.                    |
| 3 | Search Animal       | Search by ID, Tag, Type, Breed, or Health Status (case-insensitive). |
| 4 | Edit Animal         | Update any field of an existing record; Enter keeps old value.   |
| 5 | Delete Animal       | Soft-delete a record (data is retained, never wiped).             |
| 6 | Animal Summary      | Herd statistics: totals by type, health counts, weight stats.    |
| 7 | Save Records        | Persist changes to disk immediately, with backup/restore safety. |
| 8 | Help / About        | Version info, usage, and data format reference.                  |
| 0 | Save and Exit       | Save all changes and close the application.                      |

## Folder Structure

```
agri-farm-management-system/
├── .vscode/
│   ├── launch.json            # Debug configurations
│   ├── tasks.json             # Build / test tasks
│   ├── extensions.json        # Recommended VS Code extensions
│   └── c_cpp_properties.json  # IntelliSense configuration
├── src/
│   └── main.c                 # Application source code
├── tests/
│   └── test_agri_farm.c       # 60+ assertion test suite
├── docs/
│   ├── INSTRUCTOR_GUIDE.md
│   └── Agri_Farm_Project_Documentation.md
├── README.md
├── .gitignore
└── build.ps1                  # One-command build + test script
```

## Requirements

- Windows 10/11
- [MinGW-w64](https://www.mingw-w64.org/) (provides `gcc.exe` and `gdb.exe` on your `PATH`)
- [VS Code](https://code.visualstudio.com/) with the **C/C++ Extension Pack** (ms-vscode.cpptools)
- PowerShell (included with Windows) for `build.ps1`

Verify your compiler is available:

```powershell
gcc --version
```

## Build Instructions

### Option A — One command (recommended)

Open the project folder in VS Code, open a terminal (`` Ctrl+` ``), and run:

```powershell
./build.ps1
```

This will:
1. Create a `build/` folder if it doesn't exist.
2. Compile `src/main.c` → `build/agri_farm.exe`.
3. Compile `tests/test_agri_farm.c` → `build/test_agri_farm.exe`.
4. Run the test suite automatically and print PASS/FAIL results.

### Option B — VS Code Tasks

Press `Ctrl+Shift+B` to run the default build task ("Build: Application"),
or open the Command Palette → **Run Task** → choose:
- `Build: Application`
- `Build: Tests`
- `Run: Tests`
- `Build All (build.ps1)`

### Option C — Manual compilation

```powershell
gcc -std=c11 -Wall -Wextra -Wpedantic -Wshadow -Wconversion -o build\agri_farm.exe src\main.c
gcc -std=c11 -Wall -Wextra -Wpedantic -Wshadow -Wconversion -o build\test_agri_farm.exe tests\test_agri_farm.c
```

The code compiles **without warnings** under these flags.

## Run Instructions

```powershell
./build/agri_farm.exe
```

Or press `F5` in VS Code to build and launch the debugger
("Debug: Agri Farm App").

The application creates `animals.txt` in the current working directory on
first save; if it does not exist yet, the system simply starts with an
empty database.

## Data File Format

File: `animals.txt` (pipe-delimited, one record per line)

```
id|tag|type|breed|gender|birthdate|weight|health|deleted
```

Example:

```
1|COW001|Cow|Holstein|Female|2024-01-10|350.50|Healthy|0
```

- `deleted` is `0` for active records and `1` for soft-deleted records.
- Saving uses a safe write pattern: data is written to `animals.txt.tmp`,
  the previous file is backed up to `animals.txt.bak`, and only then is
  the temp file renamed into place — protecting your data even if the
  process is interrupted mid-save.

## Validation Rules

| Field         | Rule                                                                 |
|---------------|-----------------------------------------------------------------------|
| Tag           | Required, non-empty, unique, max 50 characters.                      |
| Type          | Required, non-empty, max 30 characters.                              |
| Breed         | Required, non-empty, max 40 characters.                              |
| Gender        | Must be exactly `Male` or `Female` (case-insensitive).               |
| Birth Date    | Must match `YYYY-MM-DD` and be a real calendar date (leap years included). |
| Weight        | Must be a positive number.                                            |
| Health Status | Required, non-empty (accepts common statuses or custom text), max 30 characters. |
| ID            | Auto-assigned, always a positive integer, never reused after delete. |

All input is read with `fgets()` and defensively validated — malformed or
oversized input never crashes the program.

## Screenshots

*(Add screenshots of the running application here once captured, e.g. `docs/screenshots/menu.png`.)*

## Future Improvements

- Optional CSV export for spreadsheet analysis.
- Multi-user access with file locking.
- Vaccination / treatment history log per animal.
- Pagination for very large herds in the View screen.
- Colorized terminal output.
