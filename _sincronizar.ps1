# Script de sincronização automática — Tecwise Visit Camp
# Publica alterações no GitHub Pages E no Cloudflare Pages automaticamente

$ErrorActionPreference = 'SilentlyContinue'
$projeto = "C:\Users\User\OneDrive\VS_CODE\TW_Visit_Camp"
Set-Location $projeto

# --- 1. GitHub Pages (via git push) ---
git add -A 2>$null
$alteracoes = git status --porcelain 2>$null

if ($alteracoes) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "auto: atualização $timestamp" 2>$null
    git push 2>$null
    Write-Host "✓ GitHub Pages atualizado ($timestamp)"
}

# --- 2. Cloudflare Pages (via wrangler deploy) ---
# Copia apenas o index.html para a pasta de deploy limpa
$site = "$projeto\_site"
if (-not (Test-Path $site)) { New-Item -ItemType Directory -Path $site | Out-Null }
Copy-Item "$projeto\index.html" "$site\index.html" -Force

# Faz o deploy para o Cloudflare Pages
wrangler pages deploy "$site" --project-name tw-visit --commit-dirty=true 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Cloudflare Pages atualizado — https://tw-visit.pages.dev"
}

exit 0
