
'use server';
/**
 * @fileOverview Generates an image for a given sentence using an AI model.
 * - generateImageForSentence - A function that takes a sentence and returns an image data URI.
 * - GenerateImageInput - The input type for the generateImageForSentence function.
 * - GenerateImageOutput - The return type for the generateImageForSentence function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateImageInputSchema = z.object({
  sentence: z.string().describe('The sentence to generate an image for.'),
  childAge: z.number().optional().describe('Optional age of the child to tailor image style.'),
  interests: z.string().optional().describe('Optional interests of the child to tailor image style.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

export const GenerateImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI. Format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageForSentence(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageForSentenceFlow(input);
}

const generateImageForSentenceFlow = ai.defineFlow(
  {
    name: 'generateImageForSentenceFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
    config: {
      // Allow for some flexibility in safety settings for creative content, but maintain child-appropriateness
      safetySettings: [
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    }
  },
  async (input) => {
    let promptText = `Generate a child-friendly, simple, and colorful illustration suitable for a learning app. The illustration should visually represent the following sentence: "${input.sentence}"`;
    if (input.childAge) {
      promptText += ` The style should be appropriate for a ${input.childAge}-year-old child.`;
    }
    if (input.interests) {
      promptText += ` Consider incorporating elements related to: ${input.interests}.`;
    }


    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: promptText,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      console.error('Image generation failed or no image URL was returned for sentence:', input.sentence, 'Response media:', media);
      throw new Error('Image generation failed: No image data received from the model.');
    }
    
    return { imageDataUri: media.url };
  }
);
