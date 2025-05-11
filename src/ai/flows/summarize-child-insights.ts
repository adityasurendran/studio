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
  return summarizeChildInsightsFlow(input);
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
    name: 'summarizeChildInsightsFlow',
    inputSchema: SummarizeChildInsightsInputSchema,
    outputSchema: SummarizeChildInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
