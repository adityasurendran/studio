'use server';
/**
 * @fileOverview Suggests a lesson topic for a child based on their profile and learning history.
 * - suggestLessonTopic - A function that takes child details and returns a suggested topic and reasoning.
 * - SuggestLessonTopicInput - The input type for the suggestLessonTopic function.
 * - SuggestLessonTopicOutput - The return type for the suggestLessonTopic function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { logInfo, logError, logWarn } from '@/lib/logger';

const SuggestLessonTopicInputSchema = z.object({
  childAge: z.number().describe('The age of the child.'),
  interests: z.string().optional().describe('The interests of the child.'),
  learningDifficulties: z.string().optional().describe('The learning difficulties of the child.'),
  curriculum: z.string().describe("The child's general curriculum focus (e.g., 'CBSE Grade 5 Science', 'US Grade 2 Math', 'UK National Curriculum Year 1')."),
  previousTopicsLearned: z.string().optional().describe('A summary of topics recently learned or areas covered to avoid repetition or to build upon.'),
  learningStyle: z.string().optional().describe('The preferred learning style of the child (e.g., visual, auditory, kinesthetic, reading_writing, balanced_mixed).'),
});
export type SuggestLessonTopicInput = z.infer<typeof SuggestLessonTopicInputSchema>;

const SuggestLessonTopicOutputSchema = z.object({
  suggestedTopic: z.string().describe('A concise and specific lesson topic suggestion appropriate for the child.'),
  reasoning: z.string().describe('A brief explanation of why this topic is suggested, considering the child\'s profile and curriculum.'),
});
export type SuggestLessonTopicOutput = z.infer<typeof SuggestLessonTopicOutputSchema>;

const suggestTopicPrompt = ai.definePrompt({
  name: 'suggestLessonTopicPrompt',
  input: { schema: SuggestLessonTopicInputSchema },
  output: { schema: SuggestLessonTopicOutputSchema },
  prompt: `You are an expert curriculum planner for children's education, including those with learning difficulties.
Your goal is to suggest a NEW and ENGAGING lesson topic for a child.

Consider the following child details:
- Age: {{{childAge}}}
- Interests: {{{interests}}}
- Learning Difficulties: {{{learningDifficulties}}}
- Curriculum Focus: {{{curriculum}}}
- Preferred Learning Style: {{{learningStyle}}}
- Previously Learned Topics (if any, try to suggest something new or a natural progression): {{{previousTopicsLearned}}}

Based on this, suggest ONE specific lesson topic that would be:
1.  Age-appropriate.
2.  Aligned with the specified Curriculum Focus ({{{curriculum}}}). For example, if it's "CBSE Grade 2 Maths", suggest a Grade 2 Maths topic. If it's "Irish Junior Cycle English", suggest a relevant text, skill, or theme. Be prepared to interpret diverse curriculum inputs, from specific national standards (e.g., US Common Core, UK National Curriculum, Australian Curriculum) to broader educational programs (e.g., IB, Montessori, Cambridge International) or general skill areas (e.g., 'early literacy skills', 'basic coding concepts').
3.  Ideally, related to their Interests if a natural fit exists.
4.  Sensitive to Learning Difficulties by not being overly complex initially, or suggesting a foundational concept if needed.
5.  Consider the Learning Style in how the topic might be approached (though you are just suggesting the topic itself).
6.  DIFFERENT from previously learned topics, unless it's a clear next step.

Provide the topic and a brief (1-2 sentences) reasoning for your suggestion.
The suggested topic should be something a child can learn about in a single lesson session (e.g., "The Life Cycle of a Butterfly", "Adding Two-Digit Numbers with Regrouping", "Understanding Nouns and Verbs", "Primary Colors in Art", "Introduction to Python Variables").
Do NOT suggest broad subject areas like "Math" or "Science". Be specific.

Output Format:
{
  "suggestedTopic": "Your specific topic suggestion here",
  "reasoning": "Your brief reasoning here."
}
`,
});

const suggestLessonTopicFlowInternal = ai.defineFlow(
  {
    name: 'suggestLessonTopicFlowInternal',
    inputSchema: SuggestLessonTopicInputSchema,
    outputSchema: SuggestLessonTopicOutputSchema,
  },
  async (input) => {
    logInfo('[suggestLessonTopicFlowInternal] Flow started with input:', JSON.stringify(input, null, 2));
    try {
      const { output } = await suggestTopicPrompt(input);
      if (!output) {
        logError('[suggestLessonTopicFlowInternal] AI model returned no output. Input:', JSON.stringify(input, null, 2));
        throw new Error('AI model did not return a lesson topic suggestion.');
      }
      logInfo('[suggestLessonTopicFlowInternal] Successfully received output from prompt:', JSON.stringify(output, null, 2));
      return output;
    } catch (error: any) {
      logError(`[suggestLessonTopicFlowInternal] Error during prompt execution for input: ${JSON.stringify(input, null, 2)}. Error:`, error.message ? error.message : JSON.stringify(error), "Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      let errorMessage = "Topic suggestion failed during AI prompt execution.";
      if (error && error.message) errorMessage = `AI prompt for topic suggestion failed: ${error.message}`;
      throw new Error(errorMessage);
    }
  }
);

export async function suggestLessonTopic(input: SuggestLessonTopicInput): Promise<SuggestLessonTopicOutput> {
  logInfo('[suggestLessonTopic wrapper] Called with input:', JSON.stringify(input, null, 2));
  try {
    const result = await suggestLessonTopicFlowInternal(input);
    logInfo('[suggestLessonTopic wrapper] Successfully suggested topic:', result.suggestedTopic);
    return result;
  } catch (error: any) {
     logError(`[suggestLessonTopic wrapper] Error during topic suggestion flow for input: ${JSON.stringify(input, null, 2)}. Error:`, error.message ? error.message : JSON.stringify(error), "Details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let userFriendlyMessage = "Failed to suggest a lesson topic. ";
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
