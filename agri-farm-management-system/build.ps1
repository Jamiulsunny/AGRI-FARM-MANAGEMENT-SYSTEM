<#
.SYNOPSIS
    Build script for AGRI FARM MANAGEMENT SYSTEM (Windows / PowerShell / MinGW GCC).

.DESCRIPTION
    - Creates a "build" output folder if missing.
    - Compiles src/main.c        -> build/agri_farm.exe
    - Compiles tests/test_agri_farm.c -> build/test_agri_farm.exe
    - Runs the test suite automatically.

.USAGE
    Open this folder in VS Code, then in a PowerShell terminal run:
        ./build.ps1

    Or simply press F5 / Ctrl+Shift+B if using the provided VS Code tasks.
#>

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " AGRI FARM MANAGEMENT SYSTEM - BUILD " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# ---------------------------------------------------------------------
# 1. Verify GCC is available
# ---------------------------------------------------------------------
$gcc = Get-Command gcc -ErrorAction SilentlyContinue
if (-not $gcc) {
    Write-Host "[ERROR] gcc not found on PATH. Please install MinGW-w64 and add it to PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[INFO] Using compiler: $($gcc.Source)"

# ---------------------------------------------------------------------
# 2. Ensure build directory exists
# ---------------------------------------------------------------------
$buildDir = Join-Path $PSScriptRoot "build"
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
    Write-Host "[INFO] Created build directory: $buildDir"
}

$commonFlags = @("-std=c11", "-Wall", "-Wextra", "-Wpedantic", "-Wshadow", "-Wconversion")

# ---------------------------------------------------------------------
# 3. Compile the main application
# ---------------------------------------------------------------------
$appSource = Join-Path $PSScriptRoot "src\main.c"
$appOutput = Join-Path $buildDir "agri_farm.exe"

Write-Host "`n[BUILD] Compiling application..." -ForegroundColor Yellow
& gcc @commonFlags -o $appOutput $appSource
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Application build failed." -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Application built: $appOutput" -ForegroundColor Green

# ---------------------------------------------------------------------
# 4. Compile the test suite
# ---------------------------------------------------------------------
$testSource = Join-Path $PSScriptRoot "tests\test_agri_farm.c"
$testOutput = Join-Path $buildDir "test_agri_farm.exe"

Write-Host "`n[BUILD] Compiling test suite..." -ForegroundColor Yellow
& gcc @commonFlags -o $testOutput $testSource
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Test build failed." -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Test suite built: $testOutput" -ForegroundColor Green

# ---------------------------------------------------------------------
# 5. Run the test suite
# ---------------------------------------------------------------------
Write-Host "`n[RUN] Executing test suite..." -ForegroundColor Yellow
& $testOutput
$testExit = $LASTEXITCODE

if ($testExit -eq 0) {
    Write-Host "`n[SUCCESS] All tests passed." -ForegroundColor Green
} else {
    Write-Host "`n[FAILURE] Some tests failed. See output above." -ForegroundColor Red
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host " Build complete. Run the app with:"
Write-Host "   ./build/agri_farm.exe"
Write-Host "=====================================" -ForegroundColor Cyan

exit $testExit
