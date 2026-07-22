$files = Get-ChildItem src -Recurse -Include *.css,*.scss

foreach($file in $files){

$content = Get-Content $file.FullName -Raw -Encoding UTF8

# Contrast fixes
$content = $content -replace "#000000","#cbd5e1"
$content = $content -replace "#010102","#cbd5e1"
$content = $content -replace "#01040b","#94a3b8"
$content = $content -replace "#01050f","#94a3b8"
$content = $content -replace "#02040c","#94a3b8"
$content = $content -replace "#020712","#94a3b8"
$content = $content -replace "#020817","#94a3b8"
$content = $content -replace "#020715","#94a3b8"

# Remove dangerous nowrap clipping
$content = $content -replace "white-space:\s*nowrap;","white-space:normal;"
$content = $content -replace "text-overflow:\s*ellipsis;","text-overflow:clip;"

Set-Content $file.FullName $content -Encoding UTF8
}

Write-Host "Auth CSS hardening complete"
