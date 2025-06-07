
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
  },
  async (input) => {
    let promptText = `Create a child-friendly, simple, and colorful illustration for a children's learning app. This illustration should visually depict the scene or concept described by the following text, but it is CRITICAL that you DO NOT include ANY text, letters, words, numbers, or symbols in the image itself: "${input.sentences.join(' ')}"`;
    
    if (input.childAge) {
      promptText += ` The style should be appropriate for a ${input.childAge}-year-old child.`;
    }
    if (input.interests) {
      promptText += ` Consider incorporating elements related to these interests: ${input.interests}.`;
    }
    promptText += ` Focus on a clear, imaginative, and engaging visual that complements the learning material without directly showing any written language. The final image MUST be purely pictorial and contain NO form of letters, numbers, or symbols that constitute text. ABSOLUTELY NO TEXT. The image must not contain any words or letters. Generate an image without any text. The image must be purely visual, with no words, letters, or numbers at all.`;

    try {
      console.log('[generateImageForSentenceFlowInternal] Attempting to generate image. Prompt text length:', promptText.length, 'Sentences:', input.sentences.join(' '));
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp',
        prompt: promptText,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        },
      });

      if (!media || !media.url) {
        console.error('[generateImageForSentenceFlowInternal] Image generation failed: No image URL returned by the model. Sentences:', input.sentences.join(' '), 'Full Prompt Sent:', promptText, 'Response media object:', JSON.stringify(media));
        throw new Error('Image generation failed: No image data received from the model. This might be due to content restrictions, an issue with the AI model, or the generated prompt.');
      }
      console.log('[generateImageForSentenceFlowInternal] Image generated successfully. URI length:', media.url.length);
      return { imageDataUri: media.url };
    } catch (error: any) {
      console.error("[generateImageForSentenceFlowInternal] Error during image generation for sentences:", input.sentences.join(' '), "Prompt:", promptText, "Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      let errorMessage = "Image generation failed due to an internal server error.";
      let isSafetyRelated = false;

      // Helper to check for safety-related keywords in error objects
      const checkSafetyKeywords = (obj: any): boolean => {
        if (!obj) return false;
        const S = JSON.stringify(obj).toLowerCase();
        return S.includes("safety") || S.includes("filtered") || S.includes("blocked") || S.includes("prohibited");
      };

      // Check error object and its common nested properties for safety indicators
      if (checkSafetyKeywords(error) || checkSafetyKeywords(error.details) || checkSafetyKeywords(error.cause)) {
        isSafetyRelated = true;
      }
      // Check specific finishReason fields if available
      if (error?.response?.candidates?.[0]?.finishReason === 'SAFETY' || 
          error?.details?.finishReason === 'SAFETY' || 
          (error?.cause as any)?.finishReason === 'SAFETY' || 
          error?.finishReason === 'SAFETY') {
        isSafetyRelated = true;
      }
      
      // Extract a more specific message from the error object
      if (error && error.message) {
        errorMessage = String(error.message);
      } else if (error && error.details && typeof error.details === 'string') {
        errorMessage = error.details;
      } else if (error && error.details && error.details.message && typeof error.details.message === 'string') {
        errorMessage = error.details.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = `Image generation failed. Raw error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`;
        } catch (e) {
          errorMessage = "Image generation failed due to an unstringifiable error object.";
        }
      }
      
      // Categorize and enhance error messages
      const errorStringLower = errorMessage.toLowerCase();
      if (errorStringLower.includes("api key") || errorStringLower.includes("permission denied") || errorStringLower.includes("authentication") || errorStringLower.includes("quota") || errorStringLower.includes("billing")) {
         errorMessage = `Image generation failed: There might be an issue with the Google AI API Key configuration, permissions, or billing. Please check server logs and your Google Cloud/AI Studio project. Original error: ${errorMessage}`;
      } else if (isSafetyRelated) {
        errorMessage = `Image generation was blocked due to content safety filters for the provided text: "${input.sentences.join(' ')}". Please try different wording or a different topic. Original error: ${errorMessage}`;
      }
      // Add check for model related errors if identifiable
      else if (errorStringLower.includes("model") && (errorStringLower.includes("error") || errorStringLower.includes("failed") || errorStringLower.includes("unavailable"))) {
        errorMessage = `Image generation failed: There seems to be an issue with the AI model itself. Please try again later. Original error: ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }
  }
);

// Exported async wrapper function
export async function generateImageForSentence(input: GenerateImageInput): Promise<GenerateImageOutput> {
  console.log('[generateImageForSentence wrapper] Called with input:', JSON.stringify(input, null, 2));
  try {
    const result = await generateImageForSentenceFlowInternal(input);
    console.log('[generateImageForSentence wrapper] Successfully generated image.');
    return result;
  } catch (error: any) {
    console.error(`[generateImageForSentence wrapper] Error during image generation flow for sentences "${input.sentences.join(' ')}":`, error.message ? error.message : JSON.stringify(error), "Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Construct a more user-friendly error message to be thrown up
    let userFriendlyMessage = `Failed to generate image for: "${input.sentences.join(' ')}". `;
    if (error && error.message) {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes("api key") || lowerCaseMessage.includes("permission denied") || lowerCaseMessage.includes("billing")) {
            userFriendlyMessage += "There might be an issue with the API configuration or billing. Please check server logs.";
        } else if (lowerCaseMessage.includes("model") && (lowerCaseMessage.includes("error") || lowerCaseMessage.includes("failed"))) {
            userFriendlyMessage += "The AI model encountered an issue. Please try again later.";
        } else if (lowerCaseMessage.includes("safety") || lowerCaseMessage.includes("blocked")) {
            userFriendlyMessage += "Content was blocked by safety filters. Try different wording.";
        } else {
            userFriendlyMessage += "An internal server error occurred. Please try again.";
        }
    } else {
        userFriendlyMessage += "An unknown internal server error occurred. Please try again.";
    }
    throw new Error(userFriendlyMessage);
  }
}
    