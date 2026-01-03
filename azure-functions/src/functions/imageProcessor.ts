import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';
import sharp from 'sharp';

interface ImageProcessingRequest {
    imageUrl: string;
    operation: 'analyze' | 'resize' | 'optimize';
    options?: {
        sizes?: Array<{ name: string; width: number; height: number }>;
        quality?: number;
    };
}

interface ResizedImage {
    size: string;
    url: string;
    dimensions: string;
}

export async function imageProcessor(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('🖼️ Image processing function triggered');

    try {
        const body = await request.json() as ImageProcessingRequest;
        const { imageUrl, operation, options } = body;

        if (!imageUrl || !operation) {
            return {
                status: 400,
                jsonBody: { error: 'Missing imageUrl or operation parameter' }
            };
        }

        const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const cognitiveServicesKey = process.env.COGNITIVE_SERVICES_KEY;
        const cognitiveServicesEndpoint = process.env.COGNITIVE_SERVICES_ENDPOINT;

        if (!storageConnectionString) {
            throw new Error('Storage connection string not configured');
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
        
        let result: any = {};

        switch (operation) {
            case 'analyze':
                if (cognitiveServicesKey && cognitiveServicesEndpoint) {
                    result = await analyzeImage(imageUrl, cognitiveServicesKey, cognitiveServicesEndpoint, context);
                } else {
                    return {
                        status: 400,
                        jsonBody: { error: 'Cognitive Services not configured for image analysis' }
                    };
                }
                break;
            
            case 'resize':
                result = await resizeImage(imageUrl, blobServiceClient, options?.sizes, context);
                break;
            
            case 'optimize':
                result = await optimizeImage(imageUrl, blobServiceClient, options?.quality || 80, context);
                break;
            
            default:
                return {
                    status: 400,
                    jsonBody: { error: 'Invalid operation. Supported: analyze, resize, optimize' }
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
        context.log.error('Error processing image:', error);
        return {
            status: 500,
            jsonBody: { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}

async function analyzeImage(imageUrl: string, key: string, endpoint: string, context: InvocationContext) {
    try {
        const credentials = new CognitiveServicesCredentials(key);
        const client = new ComputerVisionClient(credentials, endpoint);

        context.log('Analyzing image with Computer Vision API');
        const analysis = await client.analyzeImage(imageUrl, {
            visualFeatures: ['Categories', 'Description', 'Tags', 'Objects', 'Adult', 'Color']
        });

        return {
            description: analysis.description?.captions?.[0]?.text || 'No description available',
            confidence: analysis.description?.captions?.[0]?.confidence || 0,
            tags: analysis.tags?.map((tag: any) => ({ 
                name: tag.name, 
                confidence: tag.confidence 
            })) || [],
            categories: analysis.categories?.map((cat: any) => ({ 
                name: cat.name, 
                score: cat.score 
            })) || [],
            objects: analysis.objects?.map((obj: any) => ({ 
                object: obj.object, 
                confidence: obj.confidence,
                rectangle: obj.rectangle 
            })) || [],
            isAdultContent: analysis.adult?.isAdultContent || false,
            adultScore: analysis.adult?.adultScore || 0,
            dominantColors: analysis.color?.dominantColors || [],
            accentColor: analysis.color?.accentColor || null
        };
    } catch (error) {
        context.log.error('Error in image analysis:', error);
        throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function resizeImage(
    imageUrl: string, 
    blobServiceClient: BlobServiceClient, 
    customSizes?: Array<{ name: string; width: number; height: number }>,
    context?: InvocationContext
) {
    try {
        context?.log('Downloading image for resizing');
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }
        
        const imageBuffer = Buffer.from(await response.arrayBuffer());

        // Default sizes if none provided
        const sizes = customSizes || [
            { name: 'thumbnail', width: 150, height: 150 },
            { name: 'small', width: 400, height: 400 },
            { name: 'medium', width: 800, height: 600 },
            { name: 'large', width: 1200, height: 900 }
        ];

        const resizedImages: ResizedImage[] = [];

        // Ensure container exists
        const containerClient = blobServiceClient.getContainerClient('resized-images');
        await containerClient.createIfNotExists({ access: 'blob' });

        for (const size of sizes) {
            context?.log(`Resizing image to ${size.name}: ${size.width}x${size.height}`);
            
            const resizedBuffer = await sharp(imageBuffer)
                .resize(size.width, size.height, { 
                    fit: 'inside', 
                    withoutEnlargement: true 
                })
                .jpeg({ quality: 85 })
                .toBuffer();

            const blobName = `${Date.now()}-${size.name}.jpg`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            
            await blockBlobClient.upload(resizedBuffer, resizedBuffer.length, {
                blobHTTPHeaders: {
                    blobContentType: 'image/jpeg'
                }
            });
            
            resizedImages.push({
                size: size.name,
                url: blockBlobClient.url,
                dimensions: `${size.width}x${size.height}`
            });
        }

        return { 
            resizedImages,
            totalSizes: resizedImages.length
        };
    } catch (error) {
        context?.log.error('Error in image resizing:', error);
        throw new Error(`Image resizing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function optimizeImage(
    imageUrl: string, 
    blobServiceClient: BlobServiceClient, 
    quality: number = 80,
    context?: InvocationContext
) {
    try {
        context?.log('Downloading image for optimization');
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }
        
        const imageBuffer = Buffer.from(await response.arrayBuffer());

        // Optimize image
        const optimizedBuffer = await sharp(imageBuffer)
            .jpeg({ quality, progressive: true })
            .toBuffer();

        // Ensure container exists
        const containerClient = blobServiceClient.getContainerClient('optimized-images');
        await containerClient.createIfNotExists({ access: 'blob' });

        const blobName = `${Date.now()}-optimized.jpg`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        await blockBlobClient.upload(optimizedBuffer, optimizedBuffer.length, {
            blobHTTPHeaders: {
                blobContentType: 'image/jpeg'
            }
        });

        const originalSize = imageBuffer.length;
        const optimizedSize = optimizedBuffer.length;
        const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

        return {
            originalSize,
            optimizedSize,
            compressionRatio: `${compressionRatio}%`,
            optimizedUrl: blockBlobClient.url,
            quality
        };
    } catch (error) {
        context?.log.error('Error in image optimization:', error);
        throw new Error(`Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

app.http('imageProcessor', {
    methods: ['POST'],
    authLevel: 'function',
    handler: imageProcessor
});