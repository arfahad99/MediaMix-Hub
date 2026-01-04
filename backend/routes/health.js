const express = require('express');
const mongoose = require('mongoose');
const { getConnectionStatus } = require('../config/database');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
    try {
        const healthCheck = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            services: {
                api: 'healthy',
                database: 'checking...',
                storage: 'checking...'
            }
        };

        // Check database connection
        try {
            const dbStatus = getConnectionStatus();
            if (dbStatus.state === 'connected') {
                healthCheck.services.database = 'healthy';
                healthCheck.database = {
                    status: 'connected',
                    host: dbStatus.host,
                    name: dbStatus.name
                };
            } else {
                healthCheck.services.database = 'unhealthy';
                healthCheck.database = {
                    status: dbStatus.state,
                    error: 'Database not connected'
                };
            }
        } catch (error) {
            healthCheck.services.database = 'unhealthy';
            healthCheck.database = {
                status: 'error',
                error: error.message
            };
        }

        // Check Azure Blob Storage (if configured)
        try {
            if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
                healthCheck.services.storage = 'healthy';
                healthCheck.storage = {
                    status: 'configured',
                    type: 'azure-blob'
                };
            } else {
                healthCheck.services.storage = 'local';
                healthCheck.storage = {
                    status: 'local-filesystem',
                    type: 'local'
                };
            }
        } catch (error) {
            healthCheck.services.storage = 'unhealthy';
            healthCheck.storage = {
                status: 'error',
                error: error.message
            };
        }

        // Overall health status
        const allServicesHealthy = Object.values(healthCheck.services).every(
            service => service === 'healthy' || service === 'local'
        );

        if (!allServicesHealthy) {
            healthCheck.status = 'DEGRADED';
            return res.status(503).json(healthCheck);
        }

        res.json(healthCheck);

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message,
            services: {
                api: 'unhealthy',
                database: 'unknown',
                storage: 'unknown'
            }
        });
    }
});

// Detailed health check with more information
router.get('/detailed', async (req, res) => {
    try {
        const detailedHealth = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    external: Math.round(process.memoryUsage().external / 1024 / 1024)
                },
                cpu: process.cpuUsage()
            },
            services: {},
            configuration: {
                jwtConfigured: !!process.env.JWT_SECRET,
                azureStorageConfigured: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
                azureCosmosConfigured: !!process.env.AZURE_COSMOS_CONNECTION_STRING,
                cognitiveServicesConfigured: !!process.env.COGNITIVE_SERVICES_KEY,
                applicationInsightsConfigured: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
            }
        };

        // Database health check
        try {
            const dbStatus = getConnectionStatus();
            const dbPing = await mongoose.connection.db.admin().ping();
            
            detailedHealth.services.database = {
                status: 'healthy',
                type: process.env.AZURE_COSMOS_CONNECTION_STRING ? 'azure-cosmos-db' : 'mongodb',
                state: dbStatus.state,
                host: dbStatus.host,
                name: dbStatus.name,
                ping: dbPing.ok === 1 ? 'success' : 'failed',
                collections: (await mongoose.connection.db.listCollections().toArray()).length
            };
        } catch (error) {
            detailedHealth.services.database = {
                status: 'unhealthy',
                error: error.message
            };
        }

        // Storage health check
        try {
            if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
                const { BlobServiceClient } = require('@azure/storage-blob');
                const blobServiceClient = BlobServiceClient.fromConnectionString(
                    process.env.AZURE_STORAGE_CONNECTION_STRING
                );
                
                // Test connection by listing containers
                const containers = [];
                for await (const container of blobServiceClient.listContainers()) {
                    containers.push(container.name);
                }
                
                detailedHealth.services.storage = {
                    status: 'healthy',
                    type: 'azure-blob-storage',
                    containers: containers.length,
                    containerNames: containers
                };
            } else {
                const fs = require('fs');
                const uploadDir = process.env.UPLOAD_PATH || './uploads';
                const dirExists = fs.existsSync(uploadDir);
                
                detailedHealth.services.storage = {
                    status: dirExists ? 'healthy' : 'unhealthy',
                    type: 'local-filesystem',
                    uploadPath: uploadDir,
                    accessible: dirExists
                };
            }
        } catch (error) {
            detailedHealth.services.storage = {
                status: 'unhealthy',
                error: error.message
            };
        }

        // Azure Functions health check
        if (process.env.AZURE_FUNCTIONS_URL) {
            try {
                const functionsUrl = process.env.AZURE_FUNCTIONS_URL;
                detailedHealth.services.azureFunctions = {
                    status: 'configured',
                    url: functionsUrl,
                    note: 'Functions endpoint configured'
                };
            } catch (error) {
                detailedHealth.services.azureFunctions = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Overall status
        const serviceStatuses = Object.values(detailedHealth.services).map(s => s.status);
        const hasUnhealthy = serviceStatuses.includes('unhealthy');
        const hasErrors = serviceStatuses.includes('error');

        if (hasUnhealthy || hasErrors) {
            detailedHealth.status = 'DEGRADED';
            return res.status(503).json(detailedHealth);
        }

        res.json(detailedHealth);

    } catch (error) {
        console.error('Detailed health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Readiness probe (for Kubernetes/container orchestration)
router.get('/ready', async (req, res) => {
    try {
        // Check if all critical services are ready
        const dbStatus = getConnectionStatus();
        const isReady = dbStatus.state === 'connected';

        if (isReady) {
            res.json({
                status: 'READY',
                timestamp: new Date().toISOString(),
                message: 'Application is ready to serve requests'
            });
        } else {
            res.status(503).json({
                status: 'NOT_READY',
                timestamp: new Date().toISOString(),
                message: 'Application is not ready to serve requests',
                reason: 'Database not connected'
            });
        }
    } catch (error) {
        res.status(503).json({
            status: 'NOT_READY',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Liveness probe (for Kubernetes/container orchestration)
router.get('/live', (req, res) => {
    res.json({
        status: 'ALIVE',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Application is alive'
    });
});

module.exports = router;