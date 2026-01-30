# Database Setup Script for The Oil Boys
Write-Host "=== The Oil Boys Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get PostgreSQL credentials
$pgUser = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($pgUser)) {
    $pgUser = "postgres"
}

$pgPassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword)
)

$pgPort = Read-Host "Enter PostgreSQL port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($pgPort)) {
    $pgPort = "5432"
}

$dbName = "theoilboys"

Write-Host ""
Write-Host "Creating database '$dbName'..." -ForegroundColor Yellow

# Set PGPASSWORD environment variable for psql
$env:PGPASSWORD = $pgPasswordPlain

# Create database
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$createDbCommand = "-U $pgUser -p $pgPort -c `"CREATE DATABASE $dbName;`""

try {
    & $psqlPath -U $pgUser -p $pgPort -c "CREATE DATABASE $dbName;" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null) {
        Write-Host "[OK] Database created successfully!" -ForegroundColor Green
    } else {
        # Database might already exist, which is okay
        Write-Host "Database already exists or created (this is okay)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Note: Database might already exist (this is okay)" -ForegroundColor Yellow
}

# Clear password from environment
$env:PGPASSWORD = $null

# Step 2: Update .env file
Write-Host ""
Write-Host "Updating .env file..." -ForegroundColor Yellow

$databaseUrl = "postgresql://${pgUser}:${pgPasswordPlain}@localhost:${pgPort}/${dbName}"

$envContent = @"
# Database Connection
DATABASE_URL=$databaseUrl

# Session Secret (for development - change in production)
SESSION_SECRET=theoilboys-session-secret-2026

# Resend API Key for email notifications (optional for now)
# Get your key from https://resend.com/api-keys
RESEND_API_KEY=

# Server Port
PORT=5000
"@

$envContent | Out-File -FilePath .env -Encoding utf8 -NoNewline
Write-Host "[OK] .env file updated!" -ForegroundColor Green

# Step 3: Run database migrations
Write-Host ""
Write-Host "Setting up database tables..." -ForegroundColor Yellow
npm run db:push

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database tables created!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error creating tables. Please check the error above." -ForegroundColor Red
    exit 1
}

# Step 4: Seed database
Write-Host ""
Write-Host "Seeding database with initial data..." -ForegroundColor Yellow
npm run db:seed

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database seeded!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error seeding database. Please check the error above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test login credentials:" -ForegroundColor Yellow
Write-Host "  Manager: truman@oilboys.com / admin" -ForegroundColor White
