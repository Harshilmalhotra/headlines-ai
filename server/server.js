require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const cors = require('cors');
// Add this before other middleware
// Initialize Express app
const app = express();

// Gemini AI Client Initialization
let genAI;
try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
} catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
}

// Middleware
app.use(cors());  
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Generate headline prompt function
function createHeadlinePrompt(data) {
    const { companyName, product, platform, contentType } = data;
    
    const prompts = {
        Headlines: `Generate 3 unique and compelling marketing headlines for ${companyName}'s ${product} targeting the ${platform} audience. 
        
        Guidelines:
        - Keep each headline concise (under 10 words)
        - Highlight unique value proposition
        - Use engaging, action-oriented language
        
        Format your response as a numbered list of headlines.`,
        
        CallToAction: `Create 3 powerful call-to-action statements for ${companyName}'s ${product} designed for ${platform}. 
        
        Guidelines:
        - Make each CTA urgent and motivating
        - Clearly communicate the benefit
        - Encourage immediate action
        
        Format your response as a numbered list of CTAs.`
    };

    return prompts[contentType] || prompts['Headlines'];
}

// Generate Content Endpoint
app.post('/generate', async (req, res) => {
    try {
        // Extensive logging of incoming request
        console.log('------- GENERATE REQUEST -------');
        console.log('Incoming Request Body:', JSON.stringify(req.body, null, 2));

        // Validate request body
        const { companyName, product, platform, contentType } = req.body;
        
        if (!companyName || !product || !platform || !contentType) {
            console.error('Validation Failed - Missing Fields');
            return res.status(400).json({ 
                error: 'Missing required fields',
                receivedData: req.body
            });
        }

        // Check if Gemini AI is initialized
        if (!genAI) {
            console.error('Gemini AI Client Not Initialized');
            return res.status(500).json({ 
                error: 'Gemini AI client not initialized. Check your API key.' 
            });
        }

        // Initialize Gemini model
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-pro' 
        });

        // Generate prompt
        const prompt = createHeadlinePrompt(req.body);
        console.log('Generated Prompt:\n', prompt);

        // Generate content
        console.log('Sending request to Gemini AI...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const fullText = response.text();

        console.log('------- FULL AI RESPONSE -------');
        console.log(fullText);

        // Process headlines
        const headlines = fullText.split('\n')
            .filter(line => {
                // Remove empty lines and lines that don't look like headlines
                const cleanLine = line.trim();
                return cleanLine !== '' && 
                       !cleanLine.toLowerCase().includes('headline') &&
                       !cleanLine.toLowerCase().includes('guidelines');
            })
            .map(line => {
                // Remove numbering and trim
                return line.replace(/^\d+[\).\s]*/, '').trim();
            })
            .slice(0, 3);

        console.log('------- PROCESSED HEADLINES -------');
        console.log(headlines);

        // Send response
        res.json({ 
            headlines, 
            platform: req.body.platform,
            contentType: req.body.contentType 
        });

    } catch (error) {
        console.error('------- GENERATION ERROR -------');
        console.error('Error Details:', error);
        res.status(500).json({ 
            error: 'Failed to generate content', 
            details: error.message
        });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`HeadlinesAI server running on port ${PORT}`);
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});