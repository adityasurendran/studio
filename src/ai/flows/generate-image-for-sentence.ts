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
    name: 'generateImageForSentenceFlowInternal',
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
    try {
      const combinedSentences = input.sentences.join(' ');
      let promptText = `Create a child-friendly, simple, and colorful illustration for a children's learning app. This illustration should visually depict the scene or concept described by the following text, but DO NOT include any text, letters, or words in the image itself: "${combinedSentences}"`;
      
      if (input.childAge) {
        promptText += ` The style should be appropriate for a ${input.childAge}-year-old child.`;
      }
      if (input.interests) {
        promptText += ` Consider incorporating elements related to these interests: ${input.interests}.`;
      }
      promptText += ` Focus on a clear, imaginative, and engaging visual that complements the learning material without directly showing any written language. The final image must be purely pictorial and contain no form of letters, numbers, or symbols that constitute text. Absolutely no text.`;


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
    } catch (error: any) {
      console.error("[generateImageForSentenceFlowInternal] Error during image generation:", error);
      let errorMessage = "Image generation failed due to an internal server error.";

      if (error && error.message) {
        errorMessage = String(error.message);
      } else if (error && error.details) { // Attempt to capture more specific error details
        errorMessage = String(error.details);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = `Image generation failed with an unstringifiable error object. Raw error: ${JSON.stringify(error)}`;
        } catch (e) {
          errorMessage = "Image generation failed due to an unstringifiable error object and the error object itself could not be stringified.";
        }
      }
      
      const errorString = errorMessage.toLowerCase();
      if (errorString.includes("api key") || errorString.includes("permission denied") || errorString.includes("authentication") || errorString.includes("quota") || errorString.includes("billing")) {
         errorMessage = `Image generation failed: There might be an issue with the Google AI API Key configuration, permissions, or billing. Please check server logs and your Google Cloud/AI Studio project. Original error: ${errorMessage}`;
      }
      throw new Error(errorMessage);
    }
  }
);

// Exported async wrapper function
export async function generateImageForSentence(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageForSentenceFlowInternal(input);
}
