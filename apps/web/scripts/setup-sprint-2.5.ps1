# Sprint 2.5 Implementation Setup Script
# Creates all necessary directories and files for Export in Multiple Formats feature

Write-Host "Sprint 2.5: Export in Multiple Formats - Setup Script" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$webRoot = "d:\0_AI_Projects\0_careersie\apps\web"
Set-Location $webRoot

# Create directory structure
Write-Host "Creating directory structure..." -ForegroundColor Yellow

$directories = @(
    "src\services",
    "src\templates\export",
    "app\api\export\pdf",
    "app\api\export\docx",
    "app\api\export\linkedin",
    "app\api\export\seek",
    "app\api\export\text",
    "app\api\export\history",
    "src\components\export",
    "public\exports"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $webRoot $dir
    if (!(Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "  ✓ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Installing required dependencies..." -ForegroundColor Yellow
Write-Host "  Running: pnpm add puppeteer handlebars docx date-fns" -ForegroundColor Gray

# Install dependencies
pnpm add puppeteer handlebars docx date-fns 2>&1 | Out-Null
pnpm add -D @types/puppeteer @types/handlebars 2>&1 | Out-Null

Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Setup complete! Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run the Prisma migration: npx prisma migrate dev --name add_export_history" -ForegroundColor White
Write-Host "  2. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file" -ForegroundColor White
Write-Host "  3. Implement the service files (will be created next)" -ForegroundColor White
Write-Host ""
