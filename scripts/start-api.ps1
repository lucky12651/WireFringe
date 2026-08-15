Set-Location (Split-Path $PSScriptRoot -Parent)
python -m uvicorn server.main:app --host 127.0.0.1 --port 8000
