
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

export async function summarizeChildInsights(
  input: SummarizeChildInsightsInput
): Promise<SummarizeChildInsightsOutput> {
  console.log('[summarizeChildInsightsFlow] Attempting to summarize insights for child:', input.childName);
  try {
    const result = await summarizeChildInsightsFlow(input);
    console.log('[summarizeChildInsightsFlow] Successfully summarized insights for child:', input.childName);
    return result;
  } catch (error: any) {
    console.error(`[summarizeChildInsightsFlow] Error generating summary for child ${input.childName}:`, error.message ? error.message : JSON.stringify(error), "Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let errorMessage = "Failed to generate child insights summary.";
    if (error && error.message) errorMessage = error.message;
    throw new Error(errorMessage);
  }
}

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

const summarizeChildInsightsFlow = ai.defineFlow(
  {
    name: 'summarizeChildInsightsFlowInternal', // Renamed for clarity if wrapper has same name
    inputSchema: SummarizeChildInsightsInputSchema,
    outputSchema: SummarizeChildInsightsOutputSchema,
  },
  async input => {
    console.log('[summarizeChildInsightsFlowInternal] Flow started with input:', JSON.stringify(input, null, 2));
    try {
      const {output} = await prompt(input);
      if (!output) {
        console.error('[summarizeChildInsightsFlowInternal] AI model returned no output. Input:', JSON.stringify(input, null, 2));
        throw new Error('AI model returned no output for insights summary.');
      }
      console.log('[summarizeChildInsightsFlowInternal] Successfully received output from prompt.');
      return output;
    } catch (error: any) {
      console.error(`[summarizeChildInsightsFlowInternal] Error during prompt execution for child ${input.childName}:`, error.message ? error.message : JSON.stringify(error), "Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      let errorMessage = "Failed during AI prompt for insights summary.";
       if (error && error.message) errorMessage = error.message;
      throw new Error(errorMessage);
    }
  }
);

