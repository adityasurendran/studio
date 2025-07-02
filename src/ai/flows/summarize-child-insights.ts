'use server';

/**
 * @fileOverview AI agent for generating weekly summary of a child's learning progress and mood insights for parents.
 *
 * - summarizeChildInsights - A function that generates the weekly summary.
 * - SummarizeChildInsightsInput - The input type for the summarizeChildInsights function.
 * - SummarizeChildInsightsOutput - The return type for the summarizeChildInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { logInfo, logError } from '@/lib/logger';

const SummarizeChildInsightsInputSchema = z.object({
  childName: z.string().describe('The name of the child.'),
  learningProgress: z.string().describe('Summary of the child\'s learning progress this week.'),
  moodInsights: z.string().describe('Summary of the child\'s mood insights this week.'),
  parentUsername: z.string().describe('The username of the parent.'),
});
export type SummarizeChildInsightsInput = z.infer<
  typeof SummarizeChildInsightsInputSchema
>;

const SummarizeChildInsightsOutputSchema = z.object({
  summary: z.string().describe('The AI-generated weekly summary for the parent.'),
});
export type SummarizeChildInsightsOutput = z.infer<
  typeof SummarizeChildInsightsOutputSchema
>;

const prompt = ai.definePrompt({
  name: 'summarizeChildInsightsPrompt',
  input: {schema: SummarizeChildInsightsInputSchema},
  output: {schema: SummarizeChildInsightsOutputSchema},
  prompt: `You are an AI assistant that generates weekly summaries for parents about their child's learning progress and mood.

  Generate a concise and informative summary using the provided information. Address the parent using their username.

  Child's Name: {{{childName}}}
  Parent's Username: {{{parentUsername}}}
  Learning Progress: {{{learningProgress}}}
  Mood Insights: {{{moodInsights}}}

  Summary:`,
});

const summarizeChildInsightsFlowInternal = ai.defineFlow( // Renamed to avoid conflict with exported wrapper
  {
    name: 'summarizeChildInsightsFlowInternal', 
    inputSchema: SummarizeChildInsightsInputSchema,
    outputSchema: SummarizeChildInsightsOutputSchema,
  },
  async input => {
    logInfo('[summarizeChildInsightsFlowInternal] Flow started with input:', JSON.stringify(input, null, 2));
    try {
      const {output} = await prompt(input);
      if (!output) {
        logError('[summarizeChildInsightsFlowInternal] AI model returned no output for insights summary. Input:', JSON.stringify(input, null, 2));
        throw new Error('AI model returned no output for insights summary.');
      }
      logInfo('[summarizeChildInsightsFlowInternal] Successfully received output from prompt:', JSON.stringify(output, null, 2));
      return output;
    } catch (error: any) {
      logError(`[summarizeChildInsightsFlowInternal] Error during prompt execution for child ${input.childName}, input: ${JSON.stringify(input, null, 2)}. Error:`, error.message ? error.message : JSON.stringify(error), "Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      let errorMessage = "Failed during AI prompt for insights summary.";
       if (error && error.message) errorMessage = `AI prompt for insights summary failed: ${error.message}`;
      throw new Error(errorMessage);
    }
  }
);

export async function summarizeChildInsights(
  input: SummarizeChildInsightsInput
): Promise<SummarizeChildInsightsOutput> {
  logInfo('[summarizeChildInsights wrapper] Called with input:', JSON.stringify(input, null, 2));
  try {
    // Calling the renamed internal flow function
    const result = await summarizeChildInsightsFlowInternal(input); 
    logInfo('[summarizeChildInsights wrapper] Successfully summarized insights for child:', input.childName);
    return result;
  } catch (error: any) {
    logError(`[summarizeChildInsights wrapper] Error generating summary for child ${input.childName}, input: ${JSON.stringify(input, null, 2)}. Error:`, error.message ? error.message : JSON.stringify(error), "Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let userFriendlyMessage = `Failed to generate insights summary for ${input.childName}. `;
    if (error && error.message) {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes("api key") || lowerCaseMessage.includes("permission denied") || lowerCaseMessage.includes("billing")) {
            userFriendlyMessage += "There might be an issue with the API configuration or billing. Please check server logs.";
        } else if (lowerCaseMessage.includes("model") && (lowerCaseMessage.includes("error") || lowerCaseMessage.includes("failed"))) {
            userFriendlyMessage += "The AI model encountered an issue. Please try again later.";
        } else if (lowerCaseMessage.includes("format") || lowerCaseMessage.includes("parse")) {
            userFriendlyMessage += "The AI's response was not in the expected format. Please try again.";
        } else {
            userFriendlyMessage += "An internal server error occurred. Please try again.";
        }
    } else {
        userFriendlyMessage += "An unknown internal server error occurred. Please try again.";
    }
    throw new Error(userFriendlyMessage);
  }
}
