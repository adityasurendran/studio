'use server';
/**
 * @fileOverview Suggests a lesson topic for a child based on their profile and learning history.
 * - suggestLessonTopic - A function that takes child details and returns a suggested topic and reasoning.
 * - SuggestLessonTopicInput - The input type for the suggestLessonTopic function.
 * - SuggestLessonTopicOutput - The return type for the suggestLessonTopic function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const SuggestLessonTopicInputSchema = z.object({
  childAge: z.number().describe('The age of the child.'),
  interests: z.string().optional().describe('The interests of the child.'),
  learningDifficulties: z.string().optional().describe('The learning difficulties of the child.'),
  curriculum: z.string().describe("The child's general curriculum focus (e.g., 'CBSE Grade 5 Science', 'US Grade 2 Math')."),
  previousTopicsLearned: z.string().optional().describe('A summary of topics recently learned or areas covered to avoid repetition or to build upon.'),
  learningStyle: z.string().optional().describe('The preferred learning style of the child (e.g., visual, auditory, kinesthetic, reading_writing, balanced_mixed).'),
});
export type SuggestLessonTopicInput = z.infer<typeof SuggestLessonTopicInputSchema>;

export const SuggestLessonTopicOutputSchema = z.object({
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
2.  Aligned with the specified Curriculum Focus ({{{curriculum}}}). For example, if it's "CBSE Grade 2 Maths", suggest a Grade 2 Maths topic. If it's "Irish Junior Cycle English", suggest a relevant text, skill, or theme.
3.  Ideally, related to their Interests if a natural fit exists.
4.  Sensitive to Learning Difficulties by not being overly complex initially, or suggesting a foundational concept if needed.
5.  Consider the Learning Style in how the topic might be approached (though you are just suggesting the topic itself).
6.  DIFFERENT from previously learned topics, unless it's a clear next step.

Provide the topic and a brief (1-2 sentences) reasoning for your suggestion.
The suggested topic should be something a child can learn about in a single lesson session (e.g., "The Life Cycle of a Butterfly", "Adding Two-Digit Numbers with Regrouping", "Understanding Nouns and Verbs", "Primary Colors in Art").
Do NOT suggest broad subject areas like "Math" or "Science". Be specific.

Output Format:
{
  "suggestedTopic": "Your specific topic suggestion here",
  "reasoning": "Your brief reasoning here."
}
`,
});

const suggestLessonTopicFlow = ai.defineFlow(
  {
    name: 'suggestLessonTopicFlow',
    inputSchema: SuggestLessonTopicInputSchema,
    outputSchema: SuggestLessonTopicOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await suggestTopicPrompt(input);
      if (!output) {
        throw new Error('AI model did not return a suggestion.');
      }
      return output;
    } catch (error: any) {
      console.error("[suggestLessonTopicFlow] Error during topic suggestion:", error);
      let errorMessage = "Topic suggestion failed due to an internal server error.";
      if (error && error.message) {
        errorMessage = String(error.message);
      }
      throw new Error(errorMessage);
    }
  }
);

export async function suggestLessonTopic(input: SuggestLessonTopicInput): Promise<SuggestLessonTopicOutput> {
  return suggestLessonTopicFlow(input);
}
