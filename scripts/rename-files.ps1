# Rename openclaw.plugin.json -> omniagent.plugin.json in all extensions
$root = "D:\a2a corp\openclaw"

# Rename plugin manifests
$pluginFiles = Get-ChildItem -Path "$root\extensions" -Filter "openclaw.plugin.json" -Recurse
foreach ($f in $pluginFiles) {
    $newPath = Join-Path $f.Directory.FullName "omniagent.plugin.json"
    Rename-Item $f.FullName $newPath
    Write-Host "  Renamed: $($f.Directory.Name)/openclaw.plugin.json -> omniagent.plugin.json"
}
Write-Host "Plugin manifests renamed: $($pluginFiles.Count)"

# Rename macOS app directory if it exists
$macDir = "$root\apps\macos\Sources\OpenClaw"
if (Test-Path $macDir) {
    Rename-Item $macDir "OmniAgent"
    Write-Host "  Renamed: apps/macos/Sources/OpenClaw -> OmniAgent"
}

# Rename Android package directories
$androidSrcDir = "$root\apps\android\app\src\main\java\ai\openclaw"
if (Test-Path $androidSrcDir) {
    Rename-Item $androidSrcDir "omniagent"
    Write-Host "  Renamed: android java package ai.openclaw -> ai.omniagent"
}

$androidTestDir = "$root\apps\android\app\src\test\java\ai\openclaw"
if (Test-Path $androidTestDir) {
    Rename-Item $androidTestDir "omniagent"
    Write-Host "  Renamed: android test package ai.openclaw -> ai.omniagent"
}

# Check for any remaining openclaw.json config files
$configFiles = Get-ChildItem -Path $root -Filter "openclaw.json" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules|\.git|dist|build" }
foreach ($f in $configFiles) {
    $newPath = Join-Path $f.Directory.FullName "omniagent.json"
    Rename-Item $f.FullName $newPath
    Write-Host "  Renamed: $($f.FullName) -> omniagent.json"
}

Write-Host "`nAll file renames complete."
