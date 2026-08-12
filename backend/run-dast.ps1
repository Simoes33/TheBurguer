# ==========================================
# Configurações do Backend e ZAP
# ==========================================
$ApiBaseUrl  = "http://localhost:3000"
$LoginUrl    = "$ApiBaseUrl/auth/login"
$SecurityDir = Join-Path $PSScriptRoot "security"
$YamlPath    = Join-Path $SecurityDir "zap.yaml"
$ReportPath  = Join-Path $SecurityDir "dast-report.html"
$ZapDir      = "C:\Program Files\ZAP\Zed Attack Proxy"

# Credenciais do usuário
$Body = @{
    email    = "teste@mail.com"
    password = "Teste.123"
} | ConvertTo-Json

Write-Host "1. Autenticando na API..." -ForegroundColor Cyan

try {
    $Response = Invoke-RestMethod -Uri $LoginUrl -Method Post -Body $Body -ContentType "application/json"
    $JwtToken = $Response.access_token 

    if (-not $JwtToken) {
        throw "A propriedade 'access_token' nao foi encontrada na resposta do login."
    }

    Write-Host "OK: Token JWT obtido com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "ERRO: Falha ao autenticar na API: $_" -ForegroundColor Red
    exit 1
}

Write-Host "2. Executando OWASP ZAP Automation Framework..." -ForegroundColor Cyan

# Define a variável de ambiente temporária com o token
$env:JWT_TOKEN = $JwtToken

$CurrentLocation = Get-Location

try {
    Set-Location -Path $ZapDir

    # Executa o ZAP via Automation Framework
    & .\zap.bat -cmd -autorun "$YamlPath"

    Write-Host "OK: Execucao do ZAP concluida!" -ForegroundColor Green
}
finally {
    Set-Location -Path $CurrentLocation
    Remove-Item Env:\JWT_TOKEN -ErrorAction SilentlyContinue
}

# Verifica e abre o relatório gerado
if (Test-Path $ReportPath) {
    Write-Host "OK: Relatorio gerado com sucesso em: $ReportPath" -ForegroundColor Green
    Invoke-Item $ReportPath
} else {
    Write-Host "ERRO: Nao foi possivel encontrar o relatorio em $ReportPath" -ForegroundColor Red
}