
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
  lessonHistorySummary: z.string().describe('A detailed summary of recently completed lessons, including topics, subjects, quiz scores, and areas of difficulty or success.'),
  learningStyle: z.string().optional().describe('The preferred learning style of the child (e.g., visual, auditory, kinesthetic, reading_writing, balanced_mixed).'),
});
export type RecommendNextLessonInput = z.infer<typeof RecommendNextLessonInputSchema>;

const RecommendNextLessonOutputSchema = z.object({
  recommendedTopic: z.string().describe('A concise and specific lesson topic recommendation representing a logical next step in learning.'),
  reasoning: z.string().describe('A detailed explanation of why this topic is recommended, linking to the child\'s history, curriculum, and potential areas for growth or reinforcement.'),
  confidence: z.number().min(0).max(1).optional().describe('An optional confidence score (0-1) for the recommendation.'),
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
- Detailed Lesson History Summary (includes topics, subjects, quiz scores, points, and potentially noted difficulties or successes):
  {{{lessonHistorySummary}}}

Based on this information, recommend ONE specific lesson topic that represents the best next step in their learning journey.
Your recommendation should:
1.  Be age-appropriate and strictly align with the specified Curriculum Focus ({{{curriculum}}}).
2.  Logically follow from the Lesson History Summary. Consider:
    a.  Building upon recently mastered concepts (high scores, positive feedback) from relevant subjects.
    b.  Revisiting or offering a different approach to topics where the child struggled (low scores, noted difficulties), possibly within the same subject or a foundational one.
    c.  Introducing a new topic that is a natural progression within the {{{curriculum}}} and its subjects.
3.  Ensure the recommended topic aligns with the subject progression expected within the {{{curriculum}}}, building upon or complementing the subjects of recent lessons. For example, if the child just finished "Addition in Math", a next step could be "Subtraction in Math" or "Word Problems using Addition". If they finished "The Solar System in Science", a next step could be "Phases of the Moon in Science" or "Famous Astronauts in History" if cross-curricular links are appropriate for the curriculum.
4.  Where appropriate, connect the topic to the child's Interests to enhance engagement.
5.  Be sensitive to Learning Difficulties by suggesting topics at an appropriate complexity, or foundational concepts if prior history indicates gaps.
6.  The topic should be specific and actionable for a single lesson (e.g., "Mastering Plural Nouns", "Introduction to Variables in Python", "The Water Cycle: Evaporation and Condensation", "Comparing Fractions with Like Denominators").
7.  Avoid suggesting topics already very recently mastered with high scores unless it's a direct prerequisite for a slightly more advanced concept within the same or related subject.

Provide the recommended topic, a detailed reasoning for your suggestion explaining how it adapts to the child's path (including subject considerations), and an optional confidence score.

Output Format:
{
  "recommendedTopic": "Your specific next topic recommendation",
  "reasoning": "Your detailed reasoning, explaining how this topic builds on past performance or addresses needs within the curriculum and its subject structure, and why it's the best next step.",
  "confidence": 0.85 
}
`,
});

const recommendNextLessonFlowInternal = ai.defineFlow(
  {
    name: 'recommendNextLessonFlowInternal',
    inputSchema: RecommendNextLessonInputSchema,
    outputSchema: RecommendNextLessonOutputSchema,
  },
  async (input) => {
    console.log('[recommendNextLessonFlowInternal] Flow started with input:', JSON.stringify(input, null, 2));
    try {
      const { output } = await recommendNextLessonPrompt(input);
      if (!output) {
        console.error('[recommendNextLessonFlowInternal] AI model returned no output. Input:', JSON.stringify(input, null, 2));
        throw new Error('AI model did not return a recommendation for the next lesson.');
      }
      // Ensure confidence is a number if present, or undefined
      if (output.confidence !== undefined && typeof output.confidence !== 'number') {
        console.warn(`[recommendNextLessonFlowInternal] Confidence value was not a number, received: ${output.confidence}. Setting to undefined.`);
        output.confidence = undefined;
      } else if (output.confidence !== undefined) {
        output.confidence = Math.max(0, Math.min(1, output.confidence)); // Clamp to 0-1
      }
      console.log('[recommendNextLessonFlowInternal] Successfully received output from prompt:', JSON.stringify(output, null, 2));
      return output;
    } catch (error: any) {
      let errorDetails = `Message: ${error.message || 'No message'}, Name: ${error.name || 'No name'}`;
      if (error.stack) { errorDetails += `, Stack: ${error.stack}`; }
      try { errorDetails += `, FullErrorObject: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`; } 
      catch (e) { errorDetails += `, FullErrorObject: (Unstringifiable)`; }
      console.error(`[recommendNextLessonFlowInternal] Error during prompt execution for input: ${JSON.stringify(input, null, 2)}. ${errorDetails}`);
      
      let errorMessage = "Next lesson recommendation failed during AI prompt execution.";
      if (error && error.message) errorMessage = `AI prompt for next lesson failed: ${error.message}`;
      throw new Error(errorMessage);
    }
  }
);

export async function recommendNextLesson(input: RecommendNextLessonInput): Promise<RecommendNextLessonOutput> {
  console.log('[recommendNextLesson wrapper] Called with input:', JSON.stringify(input, null, 2));
  try {
    const result = await recommendNextLessonFlowInternal(input);
    console.log('[recommendNextLesson wrapper] Successfully recommended next lesson:', result.recommendedTopic);
    return result;
  } catch (error: any)
{
    let errorDetails = `Message: ${error.message || 'No message'}, Name: ${error.name || 'No name'}`;
    if (error.stack) { errorDetails += `, Stack: ${error.stack}`; }
    try { errorDetails += `, FullErrorObject: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`; } 
    catch (e) { errorDetails += `, FullErrorObject: (Unstringifiable)`; }
    console.error(`[recommendNextLesson wrapper] Error during next lesson recommendation flow for input: ${JSON.stringify(input, null, 2)}. ${errorDetails}`);

    let userFriendlyMessage = "Failed to recommend the next lesson. ";
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

