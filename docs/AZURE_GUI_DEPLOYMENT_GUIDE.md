# 🖱️ MediaMix Hub - Azure Portal GUI Deployment Guide

## 🎯 Complete Step-by-Step GUI Deployment for Maximum Assessment Marks

This guide will walk you through deploying MediaMix Hub using the Azure Portal web interface. Perfect for visual learners who prefer clicking through the Azure Portal rather than using command line tools.

## 📋 Prerequisites

1. **Azure Account** with $74 student credit
2. **Web Browser** (Chrome, Firefox, Edge, Safari)
3. **GitHub Account** (for code repository)
4. **Basic understanding** of Azure Portal navigation

## 🚀 Phase 1: Initial Setup

### Step 1: Access Azure Portal
1. Open your web browser
2. Navigate to **https://portal.azure.com**
3. Sign in with your Azure student account
4. Verify you have $74 in credits available

### Step 2: Create Resource Group
1. In Azure Portal, click **"Resource groups"** in the left sidebar
2. Click **"+ Create"** button
3. Fill in the details:
   - **Subscription:** Your Azure for Students subscription
   - **Resource group name:** `mediamix-hub-rg`
   - **Region:** `East US` (cost-effective)
4. Click **"Review + create"**
5. Click **"Create"**
6. Wait for deployment to complete (30 seconds)

## 🗄️ Phase 2: Database Setup (Cosmos DB)

### Step 3: Create Cosmos DB
1. In Azure Portal, click **"+ Create a resource"**
2. Search for **"Azure Cosmos DB"**
3. Click **"Azure Cosmos DB"** → **"Create"**
4. Select **"Azure Cosmos DB for MongoDB"**
5. Fill in the details:
   - **Subscription:** Your Azure for Students
   - **Resource Group:** `mediamix-hub-rg`
   - **Account Name:** `mediamix-hub-cosmos`
   - **Location:** `East US`
   - **Capacity mode:** `Provisioned throughput`
   - **Apply Free Tier Discount:** `Apply` (if available)
   - **Limit total account throughput:** ✅ Check this box
6. Click **"Review + create"**
7. Click **"Create"**
8. **⏱️ Wait 5-10 minutes** for deployment

### Step 4: Configure Cosmos DB
1. Go to your Cosmos DB resource
2. Click **"Data Explorer"** in left menu
3. Click **"New Database"**
4. Database ID: `mediamix`
5. Provision throughput: ✅ Check
6. Throughput: `400` RU/s
7. Click **"OK"**

## 💾 Phase 3: Storage Setup

### Step 5: Create Storage Account
1. Click **"+ Create a resource"**
2. Search for **"Storage account"**
3. Click **"Storage account"** → **"Create"**
4. Fill in the details:
   - **Subscription:** Your Azure for Students
   - **Resource Group:** `mediamix-hub-rg`
   - **Storage account name:** `mediamixhubstorage` + random numbers
   - **Region:** `East US`
   - **Performance:** `Standard`
   - **Redundancy:** `Locally-redundant storage (LRS)`
5. Click **"Review + create"**
6. Click **"Create"**
7. Wait for deployment (2-3 minutes)

### Step 6: Configure Storage Containers
1. Go to your Storage Account
2. Click **"Containers"** in left menu
3. Click **"+ Container"** and create these containers:
   - Name: `media-uploads`, Public access: `Blob`
   - Name: `resized-images`, Public access: `Blob`
   - Name: `optimized-images`, Public access: `Blob`
   - Name: `analytics-events`, Public access: `Private`

## 🔐 Phase 4: Security Setup

### Step 7: Create Key Vault
1. Click **"+ Create a resource"**
2. Search for **"Key Vault"**
3. Click **"Key Vault"** → **"Create"**
4. Fill in the details:
   - **Subscription:** Your Azure for Students
   - **Resource Group:** `mediamix-hub-rg`
   - **Key vault name:** `mediamix-hub-vault` + random numbers
   - **Region:** `East US`
   - **Pricing tier:** `Standard`
5. Click **"Review + create"**
6. Click **"Create"**

## 🧠 Phase 5: AI Services Setup

### Step 8: Create Cognitive Services
1. Click **"+ Create a resource"**
2. Search for **"Cognitive Services"**
3. Click **"Cognitive Services"** → **"Create"**
4. Fill in the details:
   - **Subscription:** Your Azure for Students
   - **Resource Group:** `mediamix-hub-rg`
   - **Region:** `East US`
   - **Name:** `mediamix-hub-cognitive`
   - **Pricing tier:** `F0` (Free tier)
5. Click **"Review + create"**
6. Click **"Create"**

## 📊 Phase 6: Monitoring Setup

### Step 9: Create Application Insights
1. Click **"+ Create a resource"**
2. Search for **"Application Insights"**
3. Click **"Application Insights"** → **"Create"**
4. Fill in the details:
   - **Subscription:** Your Azure for Students
   - **Resource Group:** `mediamix-hub-rg`
   - **Name:** `mediamix-hub-insights`
   - **Region:** `East US`
   - **Resource Mode:** `Classic`
5. Click **"Review + create"**
6. Click **"Create"**

## 🏗️ Phase 7: App Service Setup

### Step 10: Create App Service Plan
1. Click **"+ Create a resource"**
2. Search for **"App Service Plan"**
3. Click **"App Service Plan"** → **"Create"**
4. Fill in the details:
   - **Subscription:** Your Azure for Students
   - **Resource Group:** `mediamix-hub-rg`
   - **Name:** `mediamix-hub-plan`
   - **Operating System:** `Linux`
   - **Region:** `East US`
   - **Pricing Tier:** Click **"Change size"** → **"Dev/Test"** → **"B1"** → **"Apply"**
5. Click **"Review + create"**
6. Click **"Create"**

### Step 11: Create Backend App Service
1. Click **"+ Create a resource"**
2. Search for **"Web App"**
3. Click **"Web App"** → **"Create"**
4. Fill in the details:
   - **Subscription:** Your Azure for Students
   - **Resource Group:** `mediamix-hub-rg`
   - **Name:** `mediamix-hub-api`
   - **Publish:** `Code`
   - **Runtime stack:** `Node 18 LTS`
   - **Operating System:** `Linux`
   - **Region:** `East US`
   - **App Service Plan:** `mediamix-hub-plan`
5. Click **"Review + create"**
6. Click **"Create"**

### Step 12: Create Frontend App Service
1. Repeat Step 11 with these changes:
   - **Name:** `mediamix-hub-frontend`
   - Keep all other settings the same
2. Click **"Review + create"**
3. Click **"Create"**

## ⚡ Phase 8: Azure Functions Setup

### Step 13: Create Function App
1. Click **"+ Create a resource"**
2. Search for **"Function App"**
3. Click **"Function App"** → **"Create"**
4. Fill in the details:
   - **Subscription:** Your Azure for Students
   - **Resource Group:** `mediamix-hub-rg`
   - **Function App name:** `mediamix-hub-functions`
   - **Publish:** `Code`
   - **Runtime stack:** `Node.js`
   - **Version:** `18 LTS`
   - **Region:** `East US`
   - **Operating System:** `Linux`
   - **Plan type:** `Consumption (Serverless)`
   - **Storage Account:** Select your storage account
5. Click **"Review + create"**
6. Click **"Create"**

## 🔧 Phase 9: Configuration

### Step 14: Configure Backend App Settings
1. Go to your **Backend App Service** (`mediamix-hub-api`)
2. Click **"Configuration"** in left menu
3. Click **"+ New application setting"** for each:

**Database Settings:**
- Name: `AZURE_COSMOS_CONNECTION_STRING`
- Value: Go to Cosmos DB → Keys → Copy Primary Connection String

**Storage Settings:**
- Name: `AZURE_STORAGE_CONNECTION_STRING`
- Value: Go to Storage Account → Access Keys → Copy Connection String

**AI Settings:**
- Name: `COGNITIVE_SERVICES_KEY`
- Value: Go to Cognitive Services → Keys and Endpoint → Copy Key 1
- Name: `COGNITIVE_SERVICES_ENDPOINT`
- Value: Go to Cognitive Services → Keys and Endpoint → Copy Endpoint

**App Settings:**
- Name: `NODE_ENV`, Value: `production`
- Name: `PORT`, Value: `8000`
- Name: `JWT_SECRET`, Value: `your-super-secret-jwt-key-here`

4. Click **"Save"** at the top

### Step 15: Configure Frontend App Settings
1. Go to your **Frontend App Service** (`mediamix-hub-frontend`)
2. Click **"Configuration"** in left menu
3. Add these settings:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://mediamix-hub-api.azurewebsites.net`
4. Click **"Save"**

### Step 16: Configure Function App Settings
1. Go to your **Function App** (`mediamix-hub-functions`)
2. Click **"Configuration"** in left menu
3. Add the same settings as Backend (Steps from Step 14)
4. Click **"Save"**

## 📤 Phase 10: Code Deployment

### Step 17: Deploy Backend Code
1. Go to **Backend App Service** (`mediamix-hub-api`)
2. Click **"Deployment Center"** in left menu
3. Choose **"GitHub"** as source
4. Sign in to GitHub and authorize Azure
5. Select:
   - **Organization:** Your GitHub username
   - **Repository:** `MediaMix-Hub`
   - **Branch:** `main`
   - **Build Provider:** `App Service Build Service`
   - **Root folder:** `/backend`
6. Click **"Save"**
7. Wait for deployment (5-10 minutes)

### Step 18: Deploy Frontend Code
1. Go to **Frontend App Service** (`mediamix-hub-frontend`)
2. Click **"Deployment Center"** in left menu
3. Choose **"GitHub"** as source
4. Select:
   - **Organization:** Your GitHub username
   - **Repository:** `MediaMix-Hub`
   - **Branch:** `main`
   - **Build Provider:** `App Service Build Service`
   - **Root folder:** `/frontend-nextjs`
6. Click **"Save"**
7. Wait for deployment (5-10 minutes)

### Step 19: Deploy Azure Functions (Manual Upload)
Since Functions need special handling, we'll use a different approach:

1. **Prepare Function Code:**
   - Download your project files
   - Navigate to `azure-functions` folder
   - Create a ZIP file of all contents

2. **Upload to Function App:**
   - Go to **Function App** (`mediamix-hub-functions`)
   - Click **"Functions"** in left menu
   - Click **"Create function"**
   - Choose **"HTTP trigger"**
   - Name: `imageProcessor`
   - Authorization level: `Function`
   - Click **"Create"**

3. **Add Function Code:**
   - Click on your new function
   - Click **"Code + Test"**
   - Replace the default code with the content from `azure-functions/src/functions/imageProcessor.ts`
   - Click **"Save"**

4. **Repeat for other functions:**
   - Create `contentModerator` function
   - Create `analyticsProcessor` function

## 🌐 Phase 11: Networking & CORS

### Step 20: Configure CORS
1. **For Backend App Service:**
   - Go to `mediamix-hub-api`
   - Click **"CORS"** in left menu
   - Add allowed origins:
     - `https://mediamix-hub-frontend.azurewebsites.net`
     - `http://localhost:3000` (for development)
   - Check **"Enable Access-Control-Allow-Credentials"**
   - Click **"Save"**

2. **For Storage Account:**
   - Go to your Storage Account
   - Click **"Resource sharing (CORS)"** in left menu
   - Add CORS rule for Blob service:
     - Allowed origins: `*`
     - Allowed methods: `GET,POST,PUT,DELETE,HEAD,OPTIONS`
     - Allowed headers: `*`
     - Exposed headers: `*`
     - Max age: `3600`
   - Click **"Save"**

## 📊 Phase 12: Monitoring Setup

### Step 21: Configure Application Insights
1. **Connect Backend to Application Insights:**
   - Go to `mediamix-hub-api`
   - Click **"Application Insights"** in left menu
   - Click **"Turn on Application Insights"**
   - Select your Application Insights resource
   - Click **"Apply"**

2. **Connect Frontend to Application Insights:**
   - Repeat for `mediamix-hub-frontend`

3. **Connect Function App:**
   - Repeat for `mediamix-hub-functions`

### Step 22: Set Up Alerts
1. Go to **Application Insights** resource
2. Click **"Alerts"** in left menu
3. Click **"+ Create"** → **"Alert rule"**
4. Create alerts for:
   - **High Error Rate:** Exceptions > 10 per 5 minutes
   - **Slow Response:** Response time > 5 seconds
   - **High CPU:** CPU percentage > 80%

## 🧪 Phase 13: Testing

### Step 23: Test Your Deployment
1. **Test Frontend:**
   - Go to `https://mediamix-hub-frontend.azurewebsites.net`
   - Verify the homepage loads

2. **Test Backend API:**
   - Go to `https://mediamix-hub-api.azurewebsites.net/api/health`
   - Should return a health status

3. **Test Functions:**
   - Go to Function App → Functions → imageProcessor
   - Click **"Test/Run"**
   - Test with sample data

### Step 24: Monitor Performance
1. Go to **Application Insights**
2. Click **"Live Metrics"**
3. Monitor real-time performance
4. Check **"Failures"** and **"Performance"** tabs

## 💰 Phase 14: Cost Management

### Step 25: Set Up Cost Alerts
1. In Azure Portal, search for **"Cost Management + Billing"**
2. Click **"Cost alerts"**
3. Click **"+ Add"**
4. Create budget alert:
   - **Budget name:** `MediaMix Hub Budget`
   - **Amount:** `$70`
   - **Alert conditions:** 80% of budget
   - **Email:** Your email address

## 🎯 Phase 15: Final Verification

### Step 26: Complete Functionality Check
✅ **Infrastructure Checklist:**
- [ ] Resource Group created
- [ ] Cosmos DB running
- [ ] Storage Account with containers
- [ ] Key Vault created
- [ ] Cognitive Services active
- [ ] Application Insights configured
- [ ] App Services deployed
- [ ] Function App running

✅ **Application Checklist:**
- [ ] Frontend accessible at `https://mediamix-hub-frontend.azurewebsites.net`
- [ ] Backend API responding at `https://mediamix-hub-api.azurewebsites.net/api/health`
- [ ] Functions working in Function App
- [ ] Database connection established
- [ ] File upload to storage working
- [ ] Monitoring collecting data

## 🎥 Phase 16: Video Demonstration Preparation

### Step 27: Prepare for Assessment Video
1. **Azure Portal Tour:**
   - Show Resource Group with all services
   - Demonstrate each service is running
   - Show cost analysis (within budget)

2. **Application Demo:**
   - User registration/login
   - File upload functionality
   - Real-time features
   - Mobile responsiveness

3. **Advanced Features:**
   - Azure Functions in action
   - Application Insights dashboard
   - Auto-scaling capabilities
   - Security features

## 🏆 Expected Results

After completing this GUI deployment:

- **All Azure services** deployed and configured
- **Professional architecture** with proper separation of concerns
- **Monitoring and alerting** set up
- **Security best practices** implemented
- **Cost optimization** within $74 budget
- **Ready for 80-100% assessment marks**

## 🆘 Troubleshooting Common Issues

### Issue: App Service Won't Start
**Solution:**
1. Go to App Service → **"Log stream"**
2. Check for errors in real-time logs
3. Verify all environment variables are set
4. Check if the correct Node.js version is selected

### Issue: Database Connection Failed
**Solution:**
1. Go to Cosmos DB → **"Keys"**
2. Copy the connection string again
3. Update App Service configuration
4. Restart the App Service

### Issue: Storage Upload Not Working
**Solution:**
1. Check Storage Account → **"Access keys"**
2. Verify CORS settings
3. Ensure containers have correct access levels
4. Update connection string in App Service

### Issue: Functions Not Responding
**Solution:**
1. Go to Function App → **"Functions"**
2. Check function logs
3. Verify all dependencies are installed
4. Test functions individually

## 📞 Support Resources

- **Azure Documentation:** https://docs.microsoft.com/azure/
- **Azure Portal Help:** Click **"?"** icon in top-right
- **Azure Support:** https://azure.microsoft.com/support/
- **Community Forums:** https://docs.microsoft.com/answers/

## 🎉 Congratulations!

You've successfully deployed MediaMix Hub using the Azure Portal GUI! Your deployment includes:

- ✅ **Enterprise-grade architecture**
- ✅ **Multiple Azure services integration**
- ✅ **Professional monitoring setup**
- ✅ **Security best practices**
- ✅ **Cost-optimized configuration**

**You're now ready to achieve 80-100% (High 1st) marks in your assessment!**

---

**💡 Pro Tip:** Take screenshots of each major step for your documentation and video presentation. This shows thorough understanding of the Azure Portal and professional deployment practices.