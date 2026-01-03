import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { CognitiveServicesCredentials } from '@azure/ms-rest-azure-js';

interface ModerationRequest {
    imageUrl?: string;
    text?: string;
    operation: 'moderate-image' | 'moderate-text';
}

interface ModerationResult {
    isAppropriate: boolean;
    confidence: number;
    categories: string[];
    details: any;
}

export async function contentModerator(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('🛡️ Content moderation function triggered');

    try {
        const body = await request.json() as ModerationRequest;
        const { imageUrl, text, operation } = body;

        const cognitiveServicesKey = process.env.COGNITIVE_SERVICES_KEY;
        const cognitiveServicesEndpoint = process.env.COGNITIVE_SERVICES_ENDPOINT;

        if (!cognitiveServicesKey || !cognitiveServicesEndpoint) {
            return {
                status: 400,
                jsonBody: { error: 'Cognitive Services not configured' }
            };
        }

        let result: ModerationResult;

        switch (operation) {
            case 'moderate-image':
                if (!imageUrl) {
                    return {
                        status: 400,
                        jsonBody: { error: 'imageUrl is required for image moderation' }
                    };
                }
                result = await moderateImage(imageUrl, cognitiveServicesKey, cognitiveServicesEndpoint, context);
                break;
            
            case 'moderate-text':
                if (!text) {
                    return {
                        status: 400,
                        jsonBody: { error: 'text is required for text moderation' }
                    };
                }
                result = await moderateText(text, context);
                break;
            
            default:
                return {
                    status: 400,
                    jsonBody: { error: 'Invalid operation. Supported: moderate-image, moderate-text' }
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
        context.log.error('Error in content moderation:', error);
        return {
            status: 500,
            jsonBody: { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}

async function moderateImage(
    imageUrl: string, 
    key: string, 
    endpoint: string, 
    context: InvocationContext
): Promise<ModerationResult> {
    try {
        const credentials = new CognitiveServicesCredentials(key);
        const client = new ComputerVisionClient(credentials, endpoint);

        context.log('Analyzing image for inappropriate content');
        const analysis = await client.analyzeImage(imageUrl, {
            visualFeatures: ['Adult']
        });

        const adultContent = analysis.adult;
        const isAppropriate = !adultContent?.isAdultContent && !adultContent?.isRacyContent;
        
        const categories = [];
        if (adultContent?.isAdultContent) categories.push('adult');
        if (adultContent?.isRacyContent) categories.push('racy');

        return {
            isAppropriate,
            confidence: Math.max(adultContent?.adultScore || 0, adultContent?.racyScore || 0),
            categories,
            details: {
                adultScore: adultContent?.adultScore || 0,
                racyScore: adultContent?.racyScore || 0,
                isAdultContent: adultContent?.isAdultContent || false,
                isRacyContent: adultContent?.isRacyContent || false
            }
        };
    } catch (error) {
        context.log.error('Error in image moderation:', error);
        throw new Error(`Image moderation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function moderateText(text: string, context: InvocationContext): Promise<ModerationResult> {
    try {
        context.log('Analyzing text for inappropriate content');
        
        // Simple text moderation using keyword filtering
        // In production, you'd use Azure Content Moderator API
        const inappropriateKeywords = [
            'spam', 'scam', 'fraud', 'hate', 'violence', 'abuse',
            'harassment', 'threat', 'illegal', 'drugs', 'weapon'
        ];

        const lowerText = text.toLowerCase();
        const foundKeywords = inappropriateKeywords.filter(keyword => 
            lowerText.includes(keyword)
        );

        const isAppropriate = foundKeywords.length === 0;
        const confidence = foundKeywords.length > 0 ? 0.8 : 0.1;

        return {
            isAppropriate,
            confidence,
            categories: foundKeywords,
            details: {
                textLength: text.length,
                flaggedKeywords: foundKeywords,
                analysisMethod: 'keyword-filtering'
            }
        };
    } catch (error) {
        context.log.error('Error in text moderation:', error);
        throw new Error(`Text moderation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

app.http('contentModerator', {
    methods: ['POST'],
    authLevel: 'function',
    handler: contentModerator
});