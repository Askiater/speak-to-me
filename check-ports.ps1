# PowerShell script to check Windows reserved ports
# Run this script to see which ports are reserved by Windows

Write-Host "Checking Windows reserved port ranges..." -ForegroundColor Cyan
Write-Host ""

# Get excluded port ranges
$excludedPorts = netsh interface ipv4 show excludedportrange protocol=udp

Write-Host "UDP Excluded Port Ranges:" -ForegroundColor Yellow
Write-Host $excludedPorts
Write-Host ""

# Check if our coturn ports (49160-49200) are in the excluded range
Write-Host "Checking if coturn ports (49160-49200) are available..." -ForegroundColor Cyan

$isConflict = $false
$excludedPorts | Select-String -Pattern "(\d+)\s+(\d+)" | ForEach-Object {
    $start = [int]$_.Matches.Groups[1].Value
    $end = [int]$_.Matches.Groups[2].Value

    # Check if our range overlaps with excluded range
    if (($start -le 49200 -and $end -ge 49160)) {
        Write-Host "CONFLICT: Ports $start-$end overlap with coturn range!" -ForegroundColor Red
        $isConflict = $true
    }
}

if (-not $isConflict) {
    Write-Host "[OK] Ports 49160-49200 are available!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "To fix this, you can:" -ForegroundColor Yellow
    Write-Host "1. Use docker-compose.dev.yml instead (without coturn):" -ForegroundColor White
    Write-Host "   docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Or reduce Windows reserved port range (requires admin):" -ForegroundColor White
    Write-Host "   netsh int ipv4 set dynamic udp start=49152 num=16384" -ForegroundColor Gray
    Write-Host "   Then restart your computer" -ForegroundColor Gray
}
