
// src/ai/flows/generate-lesson.ts
'use server';

/**
 * @fileOverview Defines the GenerateTailoredLessons flow for creating personalized lessons.
 * - generateTailoredLessons - A function that generates tailored lessons based on child's profile, including text and images.
 * - GenerateTailoredLessonsInput - The input type for the generateTailoredLessons function.
 * - GenerateTailoredLessonsOutput - The return type for the generateTailoredLessons function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateImageForSentence, type GenerateImageInput } from './generate-image-for-sentence'; // Import the actual function

const LessonPageSchema = z.object({
  sentences: z.array(z.string()).describe("Sentences for this page (1 or 2)."),
  imageDataUri: z.string().nullable().describe("Data URI of the generated image for these sentences, or null if failed."),
});

const GenerateTailoredLessonsInputSchema = z.object({
  childName: z.string().describe('The name of the child.'),
  childAge: z.number().describe('The age of the child.'),
  learningDifficulties: z.string().optional().describe('The learning difficulties of the child.'),
  interests: z.string().optional().describe('The interests of the child.'),
  recentMood: z.string().describe('The recent mood of the child (e.g., happy, sad, neutral).'),
  lessonHistory: z.string().optional().describe('A summary of the child\'s previous lessons.'),
});
export type GenerateTailoredLessonsInput = z.infer<typeof GenerateTailoredLessonsInputSchema>;

const GenerateTailoredLessonsOutputSchema = z.object({
  lessonTitle: z.string().describe('The title of the generated lesson.'),
  lessonPages: z.array(LessonPageSchema).describe('An array of lesson pages, each with sentences and an image URI.'),
  lessonFormat: z.string().describe('The format of the lesson (e.g., story, quiz, activity).'),
  subject: z.string().describe('The subject of the lesson (e.g. Math, English, Science).'),
});
export type GenerateTailoredLessonsOutput = z.infer<typeof GenerateTailoredLessonsOutputSchema>;

const generateLessonPrompt = ai.definePrompt({
  name: 'generateLessonTextPrompt', // Renamed to clarify it's for text generation part
  input: {schema: GenerateTailoredLessonsInputSchema},
  // Output schema for this specific prompt is just the text content part
  output: {schema: z.object({
    lessonTitle: z.string().describe('The title of the generated lesson.'),
    lessonContent: z.array(z.string()).describe('The content of the generated lesson, as an array of individual, concise sentences. Each sentence will be displayed on a separate screen or in pairs.'),
    lessonFormat: z.string().describe('The format of the lesson (e.g., story, quiz, activity).'),
    subject: z.string().describe('The subject of the lesson (e.g. Math, English, Science).'),
  })},
  prompt: `You are an AI assistant designed to create tailored lessons for children with learning difficulties.

  Based on the following information about the child, generate a lesson that is engaging and effective. Consider the child's interests when crafting the content.

  Child Name: {{{childName}}}
  Child Age: {{{childAge}}}
  Learning Difficulties: {{{learningDifficulties}}}
  Interests: {{{interests}}}
  Recent Mood: {{{recentMood}}}
  Lesson History: {{{lessonHistory}}}

  The lesson should have a title, content (as an array of sentences), format, and subject.
  
  IMPORTANT: The 'lessonContent' field MUST be a JSON array of strings, where each string is a single, complete, and concise sentence.
  These sentences will be grouped into pairs (or a single sentence if it's the last one and the total is odd) for display with an accompanying image.
  Aim for an even number of sentences if possible, but it's not strictly required.
  Ensure sentences are short and simple.
  For example: "lessonContent": ["The quick brown fox jumps.", "He jumps over the lazy dog.", "The dog is sleeping.", "A red ball is nearby."]

  Please respond in JSON format.
  `,
});

const generateTailoredLessonsFlow = ai.defineFlow(
  {
    name: 'generateTailoredLessonsFlow',
    inputSchema: GenerateTailoredLessonsInputSchema,
    outputSchema: GenerateTailoredLessonsOutputSchema,
  },
  async (input) => {
    // 1. Generate lesson text content
    const { output: textOutput } = await generateLessonPrompt(input);
    if (!textOutput) {
      throw new Error("Failed to generate lesson text. Output was null.");
    }

    let lessonContent = textOutput.lessonContent;
    // Ensure lessonContent is an array, even if the AI messed up.
    if (typeof lessonContent === 'string') {
        const contentString = lessonContent as string;
        lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
    } else if (!Array.isArray(lessonContent)) {
        console.warn("Lesson content was not a string or array, defaulting to single sentence:", lessonContent);
        lessonContent = [String(lessonContent)];
    }
     if (lessonContent.length === 0) {
        lessonContent = ["Let's start our lesson!"]; // Fallback if AI returns empty content
    }


    // 2. Generate images for pairs of sentences
    const lessonPages: Array<{ sentences: string[]; imageDataUri: string | null }> = [];
    for (let i = 0; i < lessonContent.length; i += 2) {
      const pageSentences = lessonContent.slice(i, i + 2);
      let imageDataUri: string | null = null;
      try {
        const imageInput: GenerateImageInput = {
          sentences: pageSentences,
          childAge: input.childAge,
          interests: input.interests,
        };
        // Directly call the imported image generation function (which internally calls its flow)
        const imageResult = await generateImageForSentence(imageInput);
        imageDataUri = imageResult.imageDataUri;
      } catch (imgErr) {
        console.error(`Failed to generate image for sentences: "${pageSentences.join(' ')}"`, imgErr);
        // imageDataUri remains null, error handled by logging
      }
      lessonPages.push({ sentences: pageSentences, imageDataUri });
    }

    return {
      lessonTitle: textOutput.lessonTitle,
      lessonFormat: textOutput.lessonFormat,
      subject: textOutput.subject,
      lessonPages,
    };
  }
);

export async function generateTailoredLessons(input: GenerateTailoredLessonsInput): Promise<GenerateTailoredLessonsOutput> {
  return generateTailoredLessonsFlow(input);
}
