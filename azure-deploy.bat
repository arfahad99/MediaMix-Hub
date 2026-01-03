@echo off
REM MediaMix Hub - Azure Deployment Script for Windows
REM This script deploys the complete MediaMix Hub application to Azure Cloud using ARM templates

echo 🚀 Starting MediaMix Hub Azure Deployment...
echo ================================================

REM Configuration
set RESOURCE_GROUP=mediamix-hub-rg
set LOCATION=eastus
set PROJECT_NAME=mediamix-hub
set DEPLOYMENT_NAME=mediamix-hub-deployment-%DATE:~-4,4%%DATE:~-10,2%%DATE:~-7,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%

REM Check if Azure CLI is installed
az --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Azure CLI is not installed. Please install it first.
    echo Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
    pause
    exit /b 1
)

REM Login to Azure (if not already logged in)
echo 🔐 Checking Azure login status...
az account show >nul 2>&1
if errorlevel 1 (
    echo Please login to Azure:
    az login
)

REM Create Resource Group
echo 📦 Creating Resource Group: %RESOURCE_GROUP%
az group create --name %RESOURCE_GROUP% --location %LOCATION%

REM Deploy ARM Template
echo 🏗️ Deploying infrastructure using ARM template...
az deployment group create ^
  --resource-group %RESOURCE_GROUP% ^
  --template-file azure-infrastructure/main.json ^
  --parameters azure-infrastructure/parameters.json ^
  --name %DEPLOYMENT_NAME% ^
  --verbose

REM Get deployment outputs
echo 📋 Getting deployment outputs...
for /f "tokens=*" %%i in ('az deployment group show --resource-group %RESOURCE_GROUP% --name %DEPLOYMENT_NAME% --query properties.outputs.backendUrl.value -o tsv') do set BACKEND_URL=%%i
for /f "tokens=*" %%i in ('az deployment group show --resource-group %RESOURCE_GROUP% --name %DEPLOYMENT_NAME% --query properties.outputs.frontendUrl.value -o tsv') do set FRONTEND_URL=%%i
for /f "tokens=*" %%i in ('az deployment group show --resource-group %RESOURCE_GROUP% --name %DEPLOYMENT_NAME% --query properties.outputs.functionAppUrl.value -o tsv') do set FUNCTION_URL=%%i

REM Deploy Azure Functions
echo 🔧 Deploying Azure Functions...
cd azure-functions
call npm install
call npm run build
func azure functionapp publish %PROJECT_NAME%-functions --typescript
cd ..

REM Deploy Backend Code
echo 🔧 Deploying Backend Code...
cd backend
powershell -command "Compress-Archive -Path * -DestinationPath ../backend-deploy.zip -Force"
az webapp deployment source config-zip ^
  --resource-group %RESOURCE_GROUP% ^
  --name %PROJECT_NAME%-api ^
  --src ../backend-deploy.zip
cd ..

REM Deploy Frontend Code
echo 🎨 Deploying Frontend Code...
cd frontend-nextjs
call npm install
call npm run build
powershell -command "Compress-Archive -Path * -DestinationPath ../frontend-deploy.zip -Force -Exclude node_modules,.git,.next"
az webapp deployment source config-zip ^
  --resource-group %RESOURCE_GROUP% ^
  --name %PROJECT_NAME%-frontend ^
  --src ../frontend-deploy.zip
cd ..

REM Clean up deployment files
del backend-deploy.zip frontend-deploy.zip

REM Configure CORS for storage account
echo 🌐 Configuring CORS for storage account...
for /f "tokens=*" %%i in ('az storage account list --resource-group %RESOURCE_GROUP% --query "[0].name" -o tsv') do set STORAGE_NAME=%%i
for /f "tokens=*" %%i in ('az storage account keys list --resource-group %RESOURCE_GROUP% --account-name %STORAGE_NAME% --query "[0].value" -o tsv') do set STORAGE_KEY=%%i

az storage cors add ^
  --account-name %STORAGE_NAME% ^
  --account-key %STORAGE_KEY% ^
  --services b ^
  --methods GET POST PUT DELETE HEAD OPTIONS ^
  --origins "*" ^
  --allowed-headers "*" ^
  --exposed-headers "*" ^
  --max-age 3600

echo ✅ Complete deployment finished!
echo ================================================
echo 🎉 MediaMix Hub is now deployed to Azure!
echo.
echo 📱 Application URLs:
echo    Frontend: %FRONTEND_URL%
echo    Backend API: %BACKEND_URL%
echo    Azure Functions: %FUNCTION_URL%
echo.
echo 🔧 Management URLs:
echo    Azure Portal: https://portal.azure.com
echo    Resource Group: %RESOURCE_GROUP%
echo.
echo 📊 Next Steps:
echo 1. Test all application functionality
echo 2. Set up monitoring and alerts
echo 3. Configure custom domain (optional)
echo 4. Set up CI/CD pipeline for future deployments
echo 5. Create video demonstration for assessment
echo.
echo 💰 Estimated monthly cost: ~$70 (within your $74 budget)
echo.
pause