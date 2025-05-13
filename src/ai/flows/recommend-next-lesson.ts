
'use server';
/**
 * @fileOverview Recommends the next lesson topic for a child based on their profile and detailed learning history.
 * - recommendNextLesson - A function that takes child details and history, and returns a recommended next topic.
 * - RecommendNextLessonInput - The input type for the recommendNextLesson function.
 * - RecommendNextLessonOutput - The return type for the recommendNextLesson function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RecommendNextLessonInputSchema = z.object({
  childAge: z.number().describe('The age of the child.'),
  interests: z.string().optional().describe('The interests of the child.'),
  learningDifficulties: z.string().optional().describe('The learning difficulties of the child.'),
  curriculum: z.string().describe("The child's general curriculum focus (e.g., 'CBSE Grade 5 Science', 'US Grade 2 Math')."),
  lessonHistorySummary: z.string().describe('A detailed summary of recently completed lessons, including topics, quiz scores, and areas of difficulty or success.'),
  learningStyle: z.string().optional().describe('The preferred learning style of the child (e.g., visual, auditory, kinesthetic, reading_writing, balanced_mixed).'),
});
export type RecommendNextLessonInput = z.infer<typeof RecommendNextLessonInputSchema>;

const RecommendNextLessonOutputSchema = z.object({
  recommendedTopic: z.string().describe('A concise and specific lesson topic recommendation representing a logical next step in learning.'),
  reasoning: z.string().describe('A detailed explanation of why this topic is recommended, linking to the child\'s history, curriculum, and potential areas for growth or reinforcement.'),
  confidence: z.number().optional().min(0).max(1).describe('An optional confidence score (0-1) for the recommendation.'),
});
export type RecommendNextLessonOutput = z.infer<typeof RecommendNextLessonOutputSchema>;

const recommendNextLessonPrompt = ai.definePrompt({
  name: 'recommendNextLessonPrompt',
  input: { schema: RecommendNextLessonInputSchema },
  output: { schema: RecommendNextLessonOutputSchema },
  prompt: `You are an expert AI curriculum planner and learning path advisor for children, including those with learning difficulties.
Your goal is to recommend the MOST SUITABLE NEXT lesson topic for a child to create an adaptive learning path.

Carefully analyze the following child details and their detailed lesson history:
- Age: {{{childAge}}}
- Interests: {{{interests}}}
- Learning Difficulties: {{{learningDifficulties}}}
- Curriculum Focus: {{{curriculum}}} (This is a CRITICAL guideline. The recommendation MUST align with this curriculum.)
- Preferred Learning Style: {{{learningStyle}}}
- Detailed Lesson History Summary (includes topics, quiz scores, points, and potentially noted difficulties or successes):
  {{{lessonHistorySummary}}}

Based on this information, recommend ONE specific lesson topic that represents the best next step in their learning journey.
Your recommendation should:
1.  Be age-appropriate and strictly align with the specified Curriculum Focus ({{{curriculum}}}).
2.  Logically follow from the Lesson History Summary. Consider:
    a.  Building upon recently mastered concepts (high scores, positive feedback).
    b.  Revisiting or offering a different approach to topics where the child struggled (low scores, noted difficulties). This might involve breaking down a complex topic into smaller, more manageable parts, or suggesting a foundational skill.
    c.  Introducing a new topic that is a natural progression within the {{{curriculum}}}.
3.  Where appropriate, connect the topic to the child's Interests to enhance engagement.
4.  Be sensitive to Learning Difficulties by suggesting topics at an appropriate complexity, or foundational concepts if prior history indicates gaps.
5.  The topic should be specific and actionable for a single lesson (e.g., "Mastering Plural Nouns", "Introduction to Variables in Python", "The Water Cycle: Evaporation and Condensation", "Comparing Fractions with Like Denominators").
6.  Avoid suggesting topics already very recently mastered with high scores unless it's a direct prerequisite for a slightly more advanced concept.

Provide the recommended topic, a detailed reasoning for your suggestion explaining how it adapts to the child's path, and an optional confidence score.

Output Format:
{
  "recommendedTopic": "Your specific next topic recommendation",
  "reasoning": "Your detailed reasoning, explaining how this topic builds on past performance or addresses needs within the curriculum, and why it's the best next step.",
  "confidence": 0.85 
}
`,
});

const recommendNextLessonFlow = ai.defineFlow(
  {
    name: 'recommendNextLessonFlow',
    inputSchema: RecommendNextLessonInputSchema,
    outputSchema: RecommendNextLessonOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await recommendNextLessonPrompt(input);
      if (!output) {
        throw new Error('AI model did not return a recommendation.');
      }
      // Ensure confidence is a number if present, or undefined
      if (output.confidence !== undefined && typeof output.confidence !== 'number') {
        output.confidence = undefined;
      }
      return output;
    } catch (error: any) {
      console.error("[recommendNextLessonFlow] Error during next lesson recommendation:", error);
      let errorMessage = "Next lesson recommendation failed due to an internal server error.";
      if (error && error.message) {
        errorMessage = String(error.message);
      }
      throw new Error(errorMessage);
    }
  }
);

export async function recommendNextLesson(input: RecommendNextLessonInput): Promise<RecommendNextLessonOutput> {
  return recommendNextLessonFlow(input);
}
