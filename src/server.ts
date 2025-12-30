import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { GoogleGenAI } from "@google/genai";
import { printToUSB, watchAndResumePrinters } from './print.ts';

const app = new Hono();
const PORT = 3000;

// Enable CORS for Vite dev server
app.use('/*', cors());

watchAndResumePrinters();

// Initialize Google AI
const ai = new GoogleGenAI({
  apiKey: process.env["GEMINI_API_KEY"],
});

/**
 * Generate an image using Imagen AI
 */
async function generateImage(prompt: string): Promise<Buffer | null> {
  console.log(`🎨 Generating image: "${prompt}"`);
  console.time('generation');

  const response = await ai.models.generateImages({
    model: "imagen-4.0-generate-001",
    prompt: `A black and white kids coloring page of: ${prompt}. Simple line art, no shading.`,
    config: {
      numberOfImages: 1,
      aspectRatio: "9:16"
    },
  });

  console.timeEnd('generation');

  if (!response.generatedImages || response.generatedImages.length === 0) {
    console.error('No images generated');
    return null;
  }

  const imgBytes = response.generatedImages[0].image?.imageBytes;
  if (!imgBytes) {
    console.error('No image bytes returned');
    return null;
  }

  return Buffer.from(imgBytes, "base64");
}

/**
 * API endpoint to generate and print image
 */
app.post('/api/generate', async (c) => {
  const { prompt } = await c.req.json();

  if (!prompt) {
    return c.json({ error: 'Prompt is required' }, 400);
  }

  try {
    // Generate the image
    const buffer = await generateImage(prompt);

    if (!buffer) {
      return c.json({ error: 'Failed to generate image' }, 500);
    }

    // Print the image
    try {
      const printResult = await printToUSB(buffer, {
        fitToPage: true,
        copies: 1
      });
      console.log(`✅ Print job submitted to ${printResult.printerName}`);
    } catch (printError) {
      console.warn('⚠️ Printing failed:', printError);
      // Continue even if printing fails - still return the image
    }

    // Send the image back to the client
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`🚀 Server running at http://localhost:${info.port}`);
});

