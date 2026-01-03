import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';

interface AnalyticsRequest {
    operation: 'track-upload' | 'track-view' | 'track-download' | 'get-stats';
    data?: {
        userId?: string;
        mediaId?: string;
        mediaType?: string;
        fileSize?: number;
        timestamp?: string;
        userAgent?: string;
        ipAddress?: string;
    };
    timeRange?: {
        start: string;
        end: string;
    };
}

interface AnalyticsEvent {
    id: string;
    type: 'upload' | 'view' | 'download';
    userId?: string;
    mediaId?: string;
    mediaType?: string;
    fileSize?: number;
    timestamp: string;
    userAgent?: string;
    ipAddress?: string;
}

export async function analyticsProcessor(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('📊 Analytics processing function triggered');

    try {
        const body = await request.json() as AnalyticsRequest;
        const { operation, data, timeRange } = body;

        const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!storageConnectionString) {
            throw new Error('Storage connection string not configured');
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
        
        let result: any = {};

        switch (operation) {
            case 'track-upload':
            case 'track-view':
            case 'track-download':
                if (!data) {
                    return {
                        status: 400,
                        jsonBody: { error: 'Event data is required for tracking operations' }
                    };
                }
                result = await trackEvent(operation.replace('track-', '') as 'upload' | 'view' | 'download', data, blobServiceClient, context);
                break;
            
            case 'get-stats':
                result = await getAnalyticsStats(timeRange, blobServiceClient, context);
                break;
            
            default:
                return {
                    status: 400,
                    jsonBody: { error: 'Invalid operation. Supported: track-upload, track-view, track-download, get-stats' }
                };
        }

        return {
            status: 200,
            jsonBody: {
                success: true,
                operation,
                result,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.log.error('Error in analytics processing:', error);
        return {
            status: 500,
            jsonBody: { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}

async function trackEvent(
    eventType: 'upload' | 'view' | 'download',
    data: any,
    blobServiceClient: BlobServiceClient,
    context: InvocationContext
): Promise<{ eventId: string; tracked: boolean }> {
    try {
        const event: AnalyticsEvent = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            userId: data.userId,
            mediaId: data.mediaId,
            mediaType: data.mediaType,
            fileSize: data.fileSize,
            timestamp: data.timestamp || new Date().toISOString(),
            userAgent: data.userAgent,
            ipAddress: data.ipAddress
        };

        // Store event in blob storage as JSON
        const containerClient = blobServiceClient.getContainerClient('analytics-events');
        await containerClient.createIfNotExists();

        const blobName = `${eventType}/${new Date().toISOString().split('T')[0]}/${event.id}.json`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.upload(JSON.stringify(event), JSON.stringify(event).length, {
            blobHTTPHeaders: {
                blobContentType: 'application/json'
            }
        });

        context.log(`Tracked ${eventType} event: ${event.id}`);
        
        return {
            eventId: event.id,
            tracked: true
        };
    } catch (error) {
        context.log.error(`Error tracking ${eventType} event:`, error);
        throw new Error(`Event tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function getAnalyticsStats(
    timeRange: { start: string; end: string } | undefined,
    blobServiceClient: BlobServiceClient,
    context: InvocationContext
): Promise<any> {
    try {
        const containerClient = blobServiceClient.getContainerClient('analytics-events');
        
        // Default to last 30 days if no time range provided
        const endDate = timeRange?.end ? new Date(timeRange.end) : new Date();
        const startDate = timeRange?.start ? new Date(timeRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        context.log(`Getting analytics stats from ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const stats = {
            totalUploads: 0,
            totalViews: 0,
            totalDownloads: 0,
            totalFileSize: 0,
            mediaTypes: {} as Record<string, number>,
            dailyStats: {} as Record<string, { uploads: number; views: number; downloads: number }>,
            topUsers: {} as Record<string, number>
        };

        // List all blobs in the date range
        const blobs = containerClient.listBlobsFlat();
        
        for await (const blob of blobs) {
            try {
                // Parse date from blob name
                const datePart = blob.name.split('/')[1];
                const blobDate = new Date(datePart);
                
                if (blobDate >= startDate && blobDate <= endDate) {
                    // Download and parse the event
                    const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
                    const downloadResponse = await blockBlobClient.download();
                    const eventData = JSON.parse(await streamToString(downloadResponse.readableStreamBody!));
                    
                    // Update stats
                    const eventType = eventData.type;
                    const dateKey = datePart;
                    
                    if (!stats.dailyStats[dateKey]) {
                        stats.dailyStats[dateKey] = { uploads: 0, views: 0, downloads: 0 };
                    }
                    
                    switch (eventType) {
                        case 'upload':
                            stats.totalUploads++;
                            stats.dailyStats[dateKey].uploads++;
                            if (eventData.fileSize) stats.totalFileSize += eventData.fileSize;
                            break;
                        case 'view':
                            stats.totalViews++;
                            stats.dailyStats[dateKey].views++;
                            break;
                        case 'download':
                            stats.totalDownloads++;
                            stats.dailyStats[dateKey].downloads++;
                            break;
                    }
                    
                    // Track media types
                    if (eventData.mediaType) {
                        stats.mediaTypes[eventData.mediaType] = (stats.mediaTypes[eventData.mediaType] || 0) + 1;
                    }
                    
                    // Track top users
                    if (eventData.userId) {
                        stats.topUsers[eventData.userId] = (stats.topUsers[eventData.userId] || 0) + 1;
                    }
                }
            } catch (parseError) {
                context.log.warn(`Failed to parse blob ${blob.name}:`, parseError);
            }
        }

        return {
            ...stats,
            timeRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString()
            },
            totalEvents: stats.totalUploads + stats.totalViews + stats.totalDownloads
        };
    } catch (error) {
        context.log.error('Error getting analytics stats:', error);
        throw new Error(`Analytics stats retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks).toString());
        });
        readableStream.on('error', reject);
    });
}

app.http('analyticsProcessor', {
    methods: ['POST'],
    authLevel: 'function',
    handler: analyticsProcessor
});