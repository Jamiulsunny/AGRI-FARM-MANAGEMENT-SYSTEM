# Agri Farm Management System — Project Documentation

## 1. Introduction

The Agri Farm Management System is a console-based livestock record
management application written in strict C11. It allows a farmer or farm
manager to record, search, update, and retire animal records, along with
generating basic herd statistics, all backed by a simple, human-readable
text file — no database server required.

## 2. Problem Statement

Small and mid-size farms often track livestock using paper logs or
unstructured spreadsheets, which are error-prone, hard to search, and
easy to lose. Farmers need a lightweight, offline-first, dependable tool
that:

- Prevents duplicate or malformed records.
- Lets them find an animal's information quickly.
- Provides a snapshot of herd health and composition.
- Never silently loses data, even if the program is interrupted.

## 3. Objectives

1. Provide full CRUD (Create, Read, Update, "soft" Delete) operations for
   animal records via a simple numeric menu.
2. Validate every field so invalid data can never enter the system.
3. Persist data safely to disk using a crash-resistant save strategy.
4. Provide summary analytics (counts by type, health status, weight
   statistics) without requiring external tools.
5. Be trivially buildable and runnable inside VS Code on Windows with
   only MinGW GCC installed.
6. Be covered by an automated test suite exercising core logic.

## 4. Requirements

### Functional Requirements

- FR1: The system shall allow adding a new animal record with Tag, Type,
  Breed, Gender, Birth Date, Weight, and Health Status.
- FR2: The system shall reject a new animal whose Tag matches an existing
  active animal's Tag.
- FR3: The system shall display all active (non-deleted) animal records
  in a formatted table.
- FR4: The system shall support searching by ID, Tag, Type, Breed, or
  Health Status, case-insensitively for text fields.
- FR5: The system shall allow editing any field of an existing record by
  ID, retaining the old value when the user submits a blank entry.
- FR6: The system shall support deleting a record by ID using a
  confirmation prompt and a soft-delete flag (data is retained on disk).
- FR7: The system shall compute and display summary statistics: total
  animals, counts by common type (Cow/Goat/Sheep), healthy/sick counts,
  average weight, and the animals with the highest and lowest weight.
- FR8: The system shall load existing records from `animals.txt` on
  startup and create an empty in-memory database if the file is absent.
- FR9: The system shall save records to disk both manually (menu option)
  and automatically on exit.
- FR10: The system shall provide a Help/About screen describing the
  application, its version, and the data file format.

### Non-Functional Requirements

- NFR1: The application shall compile with zero warnings under
  `-std=c11 -Wall -Wextra -Wpedantic -Wshadow -Wconversion`.
- NFR2: The application shall never crash on malformed or oversized user
  input.
- NFR3: The application shall never use unsafe functions (`gets`,
  unguarded `scanf`).
- NFR4: File writes shall be atomic-safe: written to a temporary file,
  with the previous version backed up, before being promoted to the
  live data file.
- NFR5: The system shall support up to 1000 animal records in memory.

## 5. System Design

### 5.1 Architecture

The application follows a simple layered design within a single
translation unit for portability and ease of grading:

```
┌─────────────────────────────┐
│         main()               │  Menu loop / dispatch
├─────────────────────────────┤
│  Feature functions            │  featureAddAnimal, featureViewAll,
│                                │  featureSearch, featureEdit,
│                                │  featureDelete, featureSummary,
│                                │  featureHelp
├─────────────────────────────┤
│  Store layer                  │  storeInit, storeLoad, storeSave,
│                                │  storeFindIndexByID, storeTagExists
├─────────────────────────────┤
│  Validation layer              │  isValidGender, isValidDate,
│                                │  isValidWeightStr, isValidHealthStatus
├─────────────────────────────┤
│  Input / utility layer         │  readLine, trimWhitespace, isBlank,
│                                │  ciStrCmp, strcaseContains
└─────────────────────────────┘
```

Each layer only calls into the layer(s) below it, which keeps feature
functions simple and keeps validation/storage logic independently
testable (mirrored in `tests/test_agri_farm.c`).

### 5.2 Data Structure

```c
typedef struct {
    unsigned int id;
    char tag[MAX_NAME + 1];
    char type[MAX_TYPE + 1];
    char breed[MAX_BREED + 1];
    char gender[10];
    char birthDate[11];
    float weight;
    char healthStatus[MAX_STATUS + 1];
    int deleted;
} Animal;

typedef struct {
    Animal animals[MAX_ANIMALS];
    size_t count;
    unsigned int nextID;
    int dirty;
    char filename[PATH_SIZE];
} Store;
```

A fixed-size array (`MAX_ANIMALS = 1000`) is used instead of dynamic
allocation to keep memory management simple and predictable for a
teaching-oriented codebase, while still comfortably covering realistic
farm sizes.

### 5.3 Algorithms

- **ID Assignment**: `nextID` is a monotonically increasing counter,
  initialized to `max(existing IDs) + 1` on load, guaranteeing uniqueness
  even after deletions.
- **Duplicate Tag Check**: Linear scan over active (non-deleted) records
  comparing tags case-insensitively (`ciStrCmp`).
- **Search**: Linear scan with a per-field predicate selected by the
  user's menu choice; text fields use substring case-insensitive
  matching (`strcaseContains`), ID search uses exact match.
- **Soft Delete**: O(1) flag flip (`deleted = 1`) located via linear scan
  by ID; the record and its slot are never removed from the array.
- **Date Validation**: Parses `YYYY-MM-DD` with `sscanf`, checks month
  range, and checks day-of-month range using a days-per-month lookup
  table with a leap-year adjustment for February
  (`isLeapYear`: divisible by 4 and (not divisible by 100 or divisible
  by 400)).
- **Summary Statistics**: Single linear pass accumulating counts, a
  running weight sum (for average), and running max/min weight
  references.
- **Atomic Save**: Write to `animals.txt.tmp` → rename existing
  `animals.txt` to `animals.txt.bak` → rename `animals.txt.tmp` to
  `animals.txt`. If any step fails, the previous backup is restored.

### 5.4 Function List (src/main.c)

| Function                | Purpose                                              |
|--------------------------|-------------------------------------------------------|
| `flushStdin`             | Discard remaining characters on the current input line. |
| `readLine`                | Safe line input via `fgets`, with trimming.          |
| `trimWhitespace`          | Strip leading/trailing whitespace in place.           |
| `isBlank`                 | Check whether a string is empty/whitespace-only.      |
| `isValidGender`           | Validate Male/Female (case-insensitive).              |
| `isValidDate`             | Validate `YYYY-MM-DD` calendar dates.                 |
| `isLeapYear`              | Leap year calculation helper.                          |
| `isValidWeightStr`        | Parse & validate a positive float weight.              |
| `isValidHealthStatus`     | Validate non-empty, length-bounded health text.        |
| `toLowerCopy`             | Case-fold a string into a destination buffer.          |
| `ciStrCmp`                | Case-insensitive string comparison.                    |
| `strcaseContains`         | Case-insensitive substring search.                     |
| `storeInit`               | Initialize an empty `Store`.                           |
| `storeFindIndexByID`      | Locate an active record's array index by ID.           |
| `storeTagExists`          | Check for duplicate tags, optionally excluding an index.|
| `storeLoad`                | Parse `animals.txt` into the in-memory store.         |
| `storeSave`                | Persist the store to disk using the safe-save pattern.|
| `featureAddAnimal`        | Feature 1: interactive record creation.                |
| `featureViewAll`          | Feature 2: tabular listing of active records.          |
| `featureSearch`           | Feature 3: multi-mode search.                          |
| `featureEdit`             | Feature 4: field-by-field record editing.              |
| `featureDelete`           | Feature 5: confirmed soft delete.                      |
| `featureSummary`          | Feature 6: herd statistics.                            |
| `featureHelp`             | Feature 8: help/about screen.                          |
| `printHeader`, `printAnimalTableHeader`, `printAnimalRow`, `pauseForUser`, `promptID` | Display/input utilities. |
| `main`                    | Menu loop and dispatch.                                |

## 6. Validation Strategy

Every user-facing input point uses a "validate-and-reprompt" loop: the
program prints an error and asks again rather than accepting a
partially-valid value or crashing. Validation is centralized in small,
single-purpose predicate functions (`isValidGender`, `isValidDate`,
`isValidWeightStr`, `isValidHealthStatus`) so the same rules are reused
identically between Add and Edit flows, and so they can be unit tested
independently of the interactive menu code (see `tests/test_agri_farm.c`).

## 7. Testing

`tests/test_agri_farm.c` contains a self-contained test suite (it
re-implements the pure-logic functions under test rather than including
`main.c`, avoiding a duplicate `main` symbol) covering:

- Gender validation (valid/invalid/case-insensitivity).
- Date validation (valid dates, leap years, invalid months/days,
  malformed strings).
- Weight validation (valid decimals, zero, negative, non-numeric,
  trailing junk).
- Adding animals (ID assignment, count tracking).
- Duplicate tag rejection.
- Searching (by ID, missing ID).
- Editing (field updates persist in memory).
- Deleting (soft delete flag, record retained, excluded from active
  search, graceful handling of missing ID).
- Saving and loading (round-trip file I/O, ID continuity).
- Summary calculations (counts, sums, min/max weight).
- Capacity/edge cases and tag-existence checks.

The suite uses a lightweight `ASSERT_TRUE` macro that prints a PASS/FAIL
line per check and a final tally, with a non-zero process exit code on
any failure (suitable for CI). It contains 61 assertions.

## 8. Limitations

- Single-user, single-process design; no file locking for concurrent
  access.
- Fixed maximum capacity of 1000 records (in-memory array, not dynamic).
- No authentication or access control — anyone running the executable
  can modify data.
- Health Status is free text beyond the suggested values, so summary
  "Healthy"/"Sick" counts only recognize those two exact (case-insensitive)
  values; other statuses (Vaccinated, Pregnant, Treatment, custom) are
  counted in the total but not broken out individually in the current
  Summary screen.

## 9. Future Work

- Add a "Restore Deleted Animal" menu option.
- Add CSV import/export for spreadsheet interoperability.
- Add per-animal vaccination/treatment history.
- Add sorting and filtering options to the View screen.
- Add colorized terminal output and a progress indicator for large
  datasets.
- Add multi-farm / multi-file profile support.
