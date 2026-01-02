# Azure Cosmos DB Setup Guide 🌟

This guide will help you set up Azure Cosmos DB for the MediaMix Hub application.

## 📋 Prerequisites

- Azure account with active subscription
- Azure CLI installed (optional)
- Access to Azure Portal

## 🚀 Step 1: Create Azure Cosmos DB Account

### Using Azure Portal

1. **Sign in to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account

2. **Create Cosmos DB Account**
   - Click "Create a resource"
   - Search for "Azure Cosmos DB"
   - Click "Create" → "Azure Cosmos DB for MongoDB"

3. **Configure Basic Settings**
   ```
   Subscription: [Your subscription]
   Resource Group: [Create new or select existing]
   Account Name: mediamix-hub-cosmos (must be globally unique)
   Location: [Choose closest to your users]
   Capacity mode: Provisioned throughput (or Serverless for development)
   ```

4. **Configure MongoDB Settings**
   ```
   Version: 4.2 or higher
   Backup Policy: Periodic (or Continuous for production)
   ```

5. **Review and Create**
   - Review all settings
   - Click "Create"
   - Wait for deployment (5-10 minutes)

### Using Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name mediamix-hub-rg --location eastus

# Create Cosmos DB account
az cosmosdb create \
  --resource-group mediamix-hub-rg \
  --name mediamix-hub-cosmos \
  --kind MongoDB \
  --server-version 4.2 \
  --default-consistency-level Eventual \
  --locations regionName=eastus failoverPriority=0 isZoneRedundant=False
```

## 🔑 Step 2: Get Connection Information

1. **Navigate to your Cosmos DB Account**
   - Go to Azure Portal
   - Find your Cosmos DB account

2. **Get Connection String**
   - Click "Connection String" in the left menu
   - Copy the "Primary Connection String"
   - It should look like:
   ```
   mongodb://mediamix-hub-cosmos:XXXXX@mediamix-hub-cosmos.mongo.cosmos.azure.com:10255/mediamix-hub?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@mediamix-hub-cosmos@
   ```

3. **Note Important Details**
   ```
   Account Name: mediamix-hub-cosmos
   Primary Key: [Long string from connection string]
   Host: mediamix-hub-cosmos.mongo.cosmos.azure.com
   Port: 10255
   ```

## ⚙️ Step 3: Configure Application

1. **Update .env file**
   ```env
   # Azure Cosmos DB Configuration
   AZURE_COSMOS_CONNECTION_STRING=mongodb://mediamix-hub-cosmos:YOUR_PRIMARY_KEY@mediamix-hub-cosmos.mongo.cosmos.azure.com:10255/mediamix-hub?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@mediamix-hub-cosmos@
   
   # Azure Cosmos DB Details
   AZURE_COSMOS_ACCOUNT_NAME=mediamix-hub-cosmos
   AZURE_COSMOS_DATABASE_NAME=mediamix-hub
   AZURE_COSMOS_PRIMARY_KEY=YOUR_PRIMARY_KEY
   ```

2. **Replace Placeholders**
   - Replace `YOUR_PRIMARY_KEY` with your actual primary key
   - Replace `mediamix-hub-cosmos` with your actual account name
   - Replace `mediamix-hub` with your desired database name

## 🗄️ Step 4: Create Database and Collections

The application will automatically create the database and collections when it first runs. However, you can pre-create them:

### Using Azure Portal

1. **Go to Data Explorer**
   - In your Cosmos DB account, click "Data Explorer"

2. **Create Database**
   - Click "New Database"
   - Database id: `mediamix-hub`
   - Provision throughput: 400 RU/s (minimum)

3. **Create Collections**
   ```
   Collection 1:
   - Collection id: users
   - Partition key: /userId or /_id
   - Throughput: 400 RU/s
   
   Collection 2:
   - Collection id: media
   - Partition key: /userId
   - Throughput: 400 RU/s
   ```

### Using MongoDB Compass or CLI

```javascript
// Connect using the connection string
// Then create collections:

use mediamix-hub

// Create users collection
db.createCollection("users")

// Create media collection  
db.createCollection("media")

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.media.createIndex({ "userId": 1 })
db.media.createIndex({ "createdAt": -1 })
db.media.createIndex({ "fileType": 1 })
```

## 🔧 Step 5: Configure Throughput and Scaling

### For Development
```
Database Throughput: 400 RU/s (shared)
Collections: Use database throughput
```

### For Production
```
Users Collection: 400-1000 RU/s
Media Collection: 1000-4000 RU/s (depending on usage)
Auto-scale: Enable for variable workloads
```

## 🛡️ Step 6: Security Configuration

1. **Firewall Settings**
   - Go to "Firewall and virtual networks"
   - Add your IP address
   - For development: Allow access from Azure Portal
   - For production: Configure specific IP ranges

2. **Access Keys**
   - Regularly rotate primary/secondary keys
   - Use Azure Key Vault for production

3. **Private Endpoints** (Production)
   - Configure private endpoints for enhanced security
   - Restrict public access

## 📊 Step 7: Monitoring and Optimization

1. **Enable Monitoring**
   - Go to "Insights" to view performance metrics
   - Monitor RU consumption
   - Set up alerts for high usage

2. **Query Performance**
   - Use "Data Explorer" to test queries
   - Monitor slow queries
   - Optimize indexes based on usage patterns

3. **Cost Optimization**
   - Use serverless for development
   - Monitor and adjust RU/s based on actual usage
   - Consider reserved capacity for production

## 🧪 Step 8: Test Connection

1. **Start the Application**
   ```bash
   cd backend
   npm start
   ```

2. **Check Logs**
   Look for these success messages:
   ```
   🔄 Connecting to Azure Cosmos DB...
   🌟 Azure Cosmos DB Connected Successfully!
   📊 Database: mediamix-hub
   🔗 Host: mediamix-hub-cosmos.mongo.cosmos.azure.com
   ✅ Azure Cosmos DB ping successful
   ```

3. **Test API Endpoints**
   ```bash
   # Health check
   curl http://localhost:5000/api/health
   
   # Register a user (should create user in Cosmos DB)
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```
   Error: connection timed out
   Solution: Check firewall settings, add your IP address
   ```

2. **Authentication Failed**
   ```
   Error: Authentication failed
   Solution: Verify connection string and primary key
   ```

3. **SSL Certificate Issues**
   ```
   Error: SSL certificate problem
   Solution: Ensure ssl=true in connection string
   ```

4. **High RU Consumption**
   ```
   Error: Request rate is large
   Solution: Increase RU/s or optimize queries
   ```

### Debug Connection

Add this to your application for debugging:

```javascript
// In backend/config/database.js
mongoose.set('debug', true); // Enable mongoose debugging

// Test connection manually
const testCosmosDB = async () => {
    try {
        const result = await mongoose.connection.db.admin().ping();
        console.log('Cosmos DB Ping Result:', result);
        
        const stats = await mongoose.connection.db.stats();
        console.log('Database Stats:', stats);
    } catch (error) {
        console.error('Cosmos DB Test Failed:', error);
    }
};
```

## 💰 Cost Considerations

### Development
- Use **Serverless** tier for development
- Estimated cost: $0-10/month for light usage

### Production
- **Provisioned throughput**: $24/month for 400 RU/s minimum
- **Storage**: $0.25/GB per month
- **Backup**: Additional cost for continuous backup

### Cost Optimization Tips
1. Use shared database throughput
2. Monitor and adjust RU/s regularly
3. Implement efficient queries and indexes
4. Use TTL (Time To Live) for temporary data
5. Consider reserved capacity for predictable workloads

## 📚 Additional Resources

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [MongoDB API for Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb-introduction)
- [Mongoose with Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb-mongoose)
- [Cosmos DB Pricing](https://azure.microsoft.com/en-us/pricing/details/cosmos-db/)

## 🎯 Next Steps

After setting up Cosmos DB:

1. ✅ Configure connection string
2. ✅ Test application connectivity  
3. ✅ Set up monitoring and alerts
4. ✅ Configure backup policies
5. ✅ Implement proper indexing
6. ✅ Set up production security
7. ✅ Monitor costs and optimize

---

**Your MediaMix Hub is now powered by Azure Cosmos DB! 🚀**