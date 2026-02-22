# Fix GitHub URLs: omniagent/omniagent -> Paparusi/omniagent
$root = "D:\a2a corp\openclaw"
$excludeDirs = @("node_modules", ".git", "dist", "build")
$extensions = @("*.ts", "*.tsx", "*.js", "*.mjs", "*.json", "*.md", "*.mdx", "*.yaml", "*.yml", "*.xml", "*.swift", "*.sh", "*.html")

$find = "github.com/omniagent/omniagent"
$replace = "github.com/Paparusi/omniagent"

$count = 0
foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path $root -Filter $ext -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $rel = $_.FullName.Substring($root.Length)
            $skip = $false
            foreach ($d in $excludeDirs) {
                if ($rel -match "[\\/]$([regex]::Escape($d))[\\/]") { $skip = $true; break }
            }
            -not $skip
        }
    foreach ($f in $files) {
        $content = [System.IO.File]::ReadAllText($f.FullName)
        if ($content.Contains($find)) {
            $content = $content.Replace($find, $replace)
            [System.IO.File]::WriteAllText($f.FullName, $content)
            $count++
            Write-Host "  Fixed: $($f.FullName.Substring($root.Length + 1))"
        }
    }
}
Write-Host "`nFixed $count files"
