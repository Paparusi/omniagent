# OmniAgent Rebrand Script
# Replaces all OpenClaw branding with OmniAgent across the codebase
# Usage: powershell -ExecutionPolicy Bypass -File scripts/rebrand.ps1

$ErrorActionPreference = "Stop"
$root = "D:\a2a corp\openclaw"

Write-Host "=== OmniAgent Rebrand Script ===" -ForegroundColor Cyan
Write-Host "Root: $root" -ForegroundColor Gray

# File extensions to process
$extensions = @(
    "*.ts", "*.tsx", "*.js", "*.mjs", "*.cjs",
    "*.json",
    "*.md", "*.mdx",
    "*.yaml", "*.yml", "*.toml",
    "*.swift", "*.kt", "*.kts", "*.gradle",
    "*.plist", "*.xml",
    "*.html", "*.css", "*.scss", "*.svg",
    "*.sh", "*.bash", "*.zsh", "*.fish",
    "*.env", "*.env.*",
    "*.cfg", "*.conf", "*.ini",
    "*.txt",
    "Makefile", "Dockerfile", "*.dockerfile"
)

# Directories to skip
$excludeDirs = @(
    "node_modules", ".git", "dist", "build", ".next",
    ".turbo", ".cache", "coverage", ".nyc_output"
)

# Replacement pairs as array of [find, replace] — ORDER MATTERS (longest/most-specific first)
# Using arrays because PowerShell hashtables are case-insensitive
$replacements = @(
    # Plugin SDK types (most specific)
    @("OpenClawPluginServiceContext", "OmniAgentPluginServiceContext"),
    @("OpenClawPluginService", "OmniAgentPluginService"),
    @("OpenClawPluginApi", "OmniAgentPluginApi"),
    @("OpenClawConfig", "OmniAgentConfig"),

    # Import paths
    @("openclaw/plugin-sdk", "omniagent/plugin-sdk"),

    # File names in strings
    @("openclaw.plugin.json", "omniagent.plugin.json"),
    @("openclaw.json", "omniagent.json"),
    @("openclaw.mjs", "omniagent.mjs"),

    # Bundle IDs (most specific first)
    @("ai.openclaw.ios.bgrefresh", "ai.omniagent.ios.bgrefresh"),
    @("ai.openclaw.ios", "ai.omniagent.ios"),
    @("ai.openclaw.android", "ai.omniagent.android"),
    @("ai.openclaw.mac.deeplink", "ai.omniagent.mac.deeplink"),
    @("ai.openclaw.mac", "ai.omniagent.mac"),

    # Bonjour / network service
    @("_openclaw-gw._tcp", "_omniagent-gw._tcp"),

    # URL scheme
    @("openclaw://", "omniagent://"),

    # Environment variables (specific first)
    @("OPENCLAW_STATE_DIR", "OMNIAGENT_STATE_DIR"),
    @("OPENCLAW_CONFIG_PATH", "OMNIAGENT_CONFIG_PATH"),
    @("OPENCLAW_OAUTH_DIR", "OMNIAGENT_OAUTH_DIR"),
    @("OPENCLAW_AGENT_DIR", "OMNIAGENT_AGENT_DIR"),
    @("OPENCLAW_HOME", "OMNIAGENT_HOME"),
    @("OPENCLAW_LOAD_SHELL_ENV", "OMNIAGENT_LOAD_SHELL_ENV"),
    @("OPENCLAW_SHELL_ENV_TIMEOUT_MS", "OMNIAGENT_SHELL_ENV_TIMEOUT_MS"),
    @("OPENCLAW_GATEWAY_TOKEN", "OMNIAGENT_GATEWAY_TOKEN"),
    @("OPENCLAW_GATEWAY_PORT", "OMNIAGENT_GATEWAY_PORT"),

    # Config directory
    @(".openclaw", ".omniagent"),

    # Generic brand replacements (broadest — case variants)
    @("OPENCLAW", "OMNIAGENT"),
    @("OpenClaw", "OmniAgent"),
    @("openClaw", "omniAgent"),
    @("Openclaw", "Omniagent"),
    @("openclaw", "omniagent"),

    # ClawHub → OmniHub
    @("CLAWHUB", "OMNIHUB"),
    @("ClawHub", "OmniHub"),
    @("Clawhub", "Omnihub"),
    @("clawhub", "omnihub"),

    # Legacy compat names that reference openclaw
    @("clawdbot", "clawdbot"),  # KEEP — legacy compat, skip
    @("moltbot", "moltbot")     # KEEP — legacy compat, skip
)

# Filter out identity replacements
$actualReplacements = @()
foreach ($pair in $replacements) {
    if ($pair[0] -cne $pair[1]) {
        $actualReplacements += ,@($pair[0], $pair[1])
    }
}

Write-Host "`nReplacement pairs: $($actualReplacements.Count)" -ForegroundColor Yellow

# Collect files
Write-Host "`nCollecting files..." -ForegroundColor Yellow
$allFiles = @()
foreach ($ext in $extensions) {
    $found = Get-ChildItem -Path $root -Filter $ext -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $relativePath = $_.FullName.Substring($root.Length)
            $skip = $false
            foreach ($dir in $excludeDirs) {
                if ($relativePath -match "[\\/]$([regex]::Escape($dir))[\\/]") {
                    $skip = $true
                    break
                }
            }
            -not $skip
        }
    if ($found) { $allFiles += $found }
}

# Also find special files without standard extension
$specialFiles = @("Makefile", "Dockerfile", "Procfile")
foreach ($name in $specialFiles) {
    $found = Get-ChildItem -Path $root -Filter $name -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $relativePath = $_.FullName.Substring($root.Length)
            $skip = $false
            foreach ($dir in $excludeDirs) {
                if ($relativePath -match "[\\/]$([regex]::Escape($dir))[\\/]") {
                    $skip = $true
                    break
                }
            }
            -not $skip
        }
    if ($found) { $allFiles += $found }
}

# Deduplicate by full path
$allFiles = $allFiles | Sort-Object FullName -Unique
Write-Host "Found $($allFiles.Count) files to process" -ForegroundColor Green

# Process files
$modifiedCount = 0
$totalReplacements = 0
$errors = @()

foreach ($file in $allFiles) {
    # Skip LICENSE file (preserve original author credit)
    if ($file.Name -eq "LICENSE") { continue }

    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $original = $content
        $fileReplacements = 0

        foreach ($pair in $actualReplacements) {
            $find = $pair[0]
            $replace = $pair[1]

            # Use case-sensitive replacement
            $idx = 0
            $count = 0
            while (($idx = $content.IndexOf($find, $idx, [System.StringComparison]::Ordinal)) -ge 0) {
                $count++
                $idx += $find.Length
            }

            if ($count -gt 0) {
                $content = $content.Replace($find, $replace)
                $fileReplacements += $count
            }
        }

        if ($content -ne $original) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            $modifiedCount++
            $totalReplacements += $fileReplacements
            $relativePath = $file.FullName.Substring($root.Length + 1)
            Write-Host "  [MOD] $relativePath ($fileReplacements)" -ForegroundColor DarkGreen
        }
    }
    catch {
        $errors += "$($file.FullName): $($_.Exception.Message)"
        Write-Host "  [ERR] $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Rebrand Complete ===" -ForegroundColor Cyan
Write-Host "Files modified: $modifiedCount" -ForegroundColor Green
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Green
if ($errors.Count -gt 0) {
    Write-Host "Errors: $($errors.Count)" -ForegroundColor Red
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Rename openclaw.mjs -> omniagent.mjs"
Write-Host "  2. Rename openclaw.plugin.json files -> omniagent.plugin.json"
Write-Host "  3. Rename apps/macos/Sources/OpenClaw/ -> OmniAgent/"
Write-Host "  4. Review changes for correctness"
