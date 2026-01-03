#!/bin/bash

# MediaMix Hub - Azure Deployment Script
# This script deploys the complete MediaMix Hub application to Azure Cloud using ARM templates

echo "🚀 Starting MediaMix Hub Azure Deployment..."
echo "================================================"

# Configuration
RESOURCE_GROUP="mediamix-hub-rg"
LOCATION="eastus"
PROJECT_NAME="mediamix-hub"
DEPLOYMENT_NAME="mediamix-hub-deployment-$(date +%Y%m%d-%H%M%S)"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure (if not already logged in)
echo "🔐 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please login to Azure:"
    az login
fi

# Create Resource Group
echo "📦 Creating Resource Group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy ARM Template
echo "🏗️ Deploying infrastructure using ARM template..."
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file azure-infrastructure/main.json \
  --parameters azure-infrastructure/parameters.json \
  --name $DEPLOYMENT_NAME \
  --verbose

# Get deployment outputs
echo "📋 Getting deployment outputs..."
BACKEND_URL=$(az deployment group show --resource-group $RESOURCE_GROUP --name $DEPLOYMENT_NAME --query properties.outputs.backendUrl.value -o tsv)
FRONTEND_URL=$(az deployment group show --resource-group $RESOURCE_GROUP --name $DEPLOYMENT_NAME --query properties.outputs.frontendUrl.value -o tsv)
FUNCTION_URL=$(az deployment group show --resource-group $RESOURCE_GROUP --name $DEPLOYMENT_NAME --query properties.outputs.functionAppUrl.value -o tsv)

# Deploy Azure Functions
echo "🔧 Deploying Azure Functions..."
cd azure-functions
npm install
npm run build
func azure functionapp publish "${PROJECT_NAME}-functions" --typescript
cd ..

# Deploy Backend Code
echo "🔧 Deploying Backend Code..."
cd backend
zip -r ../backend-deploy.zip . -x node_modules/\* .git/\*
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name "${PROJECT_NAME}-api" \
  --src ../backend-deploy.zip
cd ..

# Deploy Frontend Code
echo "🎨 Deploying Frontend Code..."
cd frontend-nextjs
npm install
npm run build
zip -r ../frontend-deploy.zip . -x node_modules/\* .git/\* .next/\*
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name "${PROJECT_NAME}-frontend" \
  --src ../frontend-deploy.zip
cd ..

# Clean up deployment files
rm -f backend-deploy.zip frontend-deploy.zip

# Configure CORS for storage account
echo "🌐 Configuring CORS for storage account..."
STORAGE_NAME=$(az storage account list --resource-group $RESOURCE_GROUP --query "[0].name" -o tsv)
STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_NAME --query "[0].value" -o tsv)

az storage cors add \
  --account-name $STORAGE_NAME \
  --account-key $STORAGE_KEY \
  --services b \
  --methods GET POST PUT DELETE HEAD OPTIONS \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600

echo "✅ Complete deployment finished!"
echo "================================================"
echo "🎉 MediaMix Hub is now deployed to Azure!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend API: $BACKEND_URL"
echo "   Azure Functions: $FUNCTION_URL"
echo ""
echo "🔧 Management URLs:"
echo "   Azure Portal: https://portal.azure.com"
echo "   Resource Group: $RESOURCE_GROUP"
echo ""
echo "📊 Next Steps:"
echo "1. Test all application functionality"
echo "2. Set up monitoring and alerts"
echo "3. Configure custom domain (optional)"
echo "4. Set up CI/CD pipeline for future deployments"
echo "5. Create video demonstration for assessment"
echo ""
echo "💰 Estimated monthly cost: ~$70 (within your $74 budget)"