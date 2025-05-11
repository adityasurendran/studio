
'use server';
/**
 * @fileOverview Generates an image for a given sentence or pair of sentences using an AI model.
 * - generateImageForSentence - A function that takes sentences and returns an image data URI.
 * - GenerateImageInput - The input type for the generateImageForSentence function.
 * - GenerateImageOutput - The return type for the generateImageForSentence function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  sentences: z.array(z.string()).min(1, "At least one sentence is required.").max(2, "No more than two sentences are allowed.").describe('The sentences to generate an image for (1 or 2).'),
  childAge: z.number().optional().describe('Optional age of the child to tailor image style.'),
  interests: z.string().optional().describe('Optional interests of the child to tailor image style.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI. Format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

// This is the internal flow function. The exported wrapper will call this.
const generateImageForSentenceFlowInternal = ai.defineFlow(
  {
    name: 'generateImageForSentenceFlowInternal', // Renamed to avoid conflict if we keep the wrapper name same
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
    config: {
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }
  },
  async (input) => {
    const combinedSentences = input.sentences.join(' ');
    let promptText = `Generate a child-friendly, simple, and colorful illustration suitable for a learning app. The illustration should visually represent the following text: "${combinedSentences}"`;
    
    if (input.childAge) {
      promptText += ` The style should be appropriate for a ${input.childAge}-year-old child.`;
    }
    if (input.interests) {
      promptText += ` Consider incorporating elements related to these interests: ${input.interests}.`;
    }

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: promptText,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      console.error('Image generation failed or no image URL was returned for sentences:', input.sentences.join(' '), 'Response media:', media);
      throw new Error('Image generation failed: No image data received from the model.');
    }
    
    return { imageDataUri: media.url };
  }
);

// Exported async wrapper function
export async function generateImageForSentence(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageForSentenceFlowInternal(input);
}
