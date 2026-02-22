# Rename all source files with "openclaw" in the name to "omniagent"
$root = "D:\a2a corp\openclaw\src"
$excludeDirs = @("node_modules", "dist", "build")

$files = Get-ChildItem -Path $root -Recurse -File |
    Where-Object {
        $_.Name -match "openclaw" -and
        $_.FullName -notmatch "node_modules|dist[\\/]|build[\\/]"
    }

$count = 0
foreach ($f in $files) {
    $newName = $f.Name -creplace "openclaw", "omniagent" -creplace "OpenClaw", "OmniAgent"
    if ($newName -ne $f.Name) {
        $newPath = Join-Path $f.Directory.FullName $newName
        Rename-Item $f.FullName $newPath
        $rel = $f.FullName.Replace("D:\a2a corp\openclaw\", "")
        Write-Host "  $rel -> $newName"
        $count++
    }
}
Write-Host "`nRenamed $count files"

# Also check root-level files
$rootFiles = Get-ChildItem -Path "D:\a2a corp\openclaw" -File |
    Where-Object { $_.Name -match "openclaw" }

foreach ($f in $rootFiles) {
    $newName = $f.Name -creplace "openclaw", "omniagent" -creplace "OpenClaw", "OmniAgent"
    if ($newName -ne $f.Name) {
        Rename-Item $f.FullName $newName
        Write-Host "  (root) $($f.Name) -> $newName"
        $count++
    }
}

# Check extensions too
$extFiles = Get-ChildItem -Path "D:\a2a corp\openclaw\extensions" -Recurse -File |
    Where-Object {
        $_.Name -match "openclaw" -and
        $_.FullName -notmatch "node_modules"
    }

foreach ($f in $extFiles) {
    $newName = $f.Name -creplace "openclaw", "omniagent" -creplace "OpenClaw", "OmniAgent"
    if ($newName -ne $f.Name) {
        $newPath = Join-Path $f.Directory.FullName $newName
        Rename-Item $f.FullName $newPath
        $rel = $f.FullName.Replace("D:\a2a corp\openclaw\", "")
        Write-Host "  $rel -> $newName"
        $count++
    }
}

# Check test directory
$testFiles = Get-ChildItem -Path "D:\a2a corp\openclaw\test" -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -match "openclaw" -and
        $_.FullName -notmatch "node_modules"
    }

foreach ($f in $testFiles) {
    $newName = $f.Name -creplace "openclaw", "omniagent" -creplace "OpenClaw", "OmniAgent"
    if ($newName -ne $f.Name) {
        $newPath = Join-Path $f.Directory.FullName $newName
        Rename-Item $f.FullName $newPath
        $rel = $f.FullName.Replace("D:\a2a corp\openclaw\", "")
        Write-Host "  $rel -> $newName"
        $count++
    }
}

# Check scripts, docs, ui
foreach ($dir in @("scripts", "docs", "ui", "apps", "packages", ".github")) {
    $dirPath = "D:\a2a corp\openclaw\$dir"
    if (Test-Path $dirPath) {
        $found = Get-ChildItem -Path $dirPath -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Name -match "openclaw" -and
                $_.FullName -notmatch "node_modules"
            }
        foreach ($f in $found) {
            $newName = $f.Name -creplace "openclaw", "omniagent" -creplace "OpenClaw", "OmniAgent"
            if ($newName -ne $f.Name) {
                $newPath = Join-Path $f.Directory.FullName $newName
                Rename-Item $f.FullName $newPath
                $rel = $f.FullName.Replace("D:\a2a corp\openclaw\", "")
                Write-Host "  $rel -> $newName"
                $count++
            }
        }
    }
}

Write-Host "`nTotal renamed: $count"
