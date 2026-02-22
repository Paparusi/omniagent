# Publish OmniAgent to npm as "@paparusi/omniagent"
# The internal workspace name must stay "omniagent" for pnpm workspace resolution.
# This script temporarily renames for npm publish, then reverts.

$root = "D:\a2a corp\openclaw"
$pkgPath = Join-Path $root "package.json"

# Read current package.json
$pkg = Get-Content $pkgPath -Raw

# Temporarily change name for publish
$publishPkg = $pkg.Replace('"name": "omniagent"', '"name": "omniorg"')
[System.IO.File]::WriteAllText($pkgPath, $publishPkg)

Write-Host "Package name set to '@paparusi/omniagent' for publish" -ForegroundColor Yellow

try {
    Set-Location $root
    npm publish --access public 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nPublished successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nPublish failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    }
} finally {
    # Always revert name
    [System.IO.File]::WriteAllText($pkgPath, $pkg)
    Write-Host "Package name reverted to 'omniagent' (workspace)" -ForegroundColor Gray
}
