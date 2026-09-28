# Install the icpc-bsu-slides skill (Windows PowerShell).
#   & ([scriptblock]::Create((irm https://raw.githubusercontent.com/ABDELWAHABx/icpc-bsu-slides/main/install.ps1))) claude
# Agents: claude | codex | antigravity | all | <custom skills dir>
param([string]$Target = "claude")
$ErrorActionPreference = "Stop"
$Repo = "https://github.com/ABDELWAHABx/icpc-bsu-slides.git"

function Get-SkillsDir($name) {
  switch ($name) {
    "claude"      { return Join-Path $HOME ".claude\skills" }
    "codex"       { if ($env:CODEX_HOME) { return Join-Path $env:CODEX_HOME "skills" } else { return Join-Path $HOME ".codex\skills" } }
    "antigravity" { return Join-Path $HOME ".gemini\antigravity\skills" }
    default       { return $name }
  }
}

function Install-To($name) {
  $base = Get-SkillsDir $name
  $dest = Join-Path $base "icpc-bsu-slides"
  New-Item -ItemType Directory -Force $base | Out-Null
  if (Test-Path (Join-Path $dest ".git")) { Write-Host "updating $dest"; git -C $dest pull --ff-only }
  else { Write-Host "installing to $dest"; git clone --depth 1 $Repo $dest }
  Push-Location $dest; npm install --no-fund --no-audit --silent; Pop-Location
  Write-Host "icpc-bsu-slides ready in $dest" -ForegroundColor Green
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git is required" }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js 18+ is required (https://nodejs.org)" }

if ($Target -eq "all") { "claude", "codex", "antigravity" | ForEach-Object { Install-To $_ } } else { Install-To $Target }
Write-Host "Needs Google Chrome or Microsoft Edge installed (used headless to render slides)."
