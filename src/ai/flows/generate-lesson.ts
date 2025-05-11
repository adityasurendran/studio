// src/ai/flows/generate-lesson.ts
'use server';

/**
 * @fileOverview This file contains the Genkit flow for generating tailored lessons for children.
 *
 * It takes child profile data, recent mood, and lesson history as input and uses the Gemini API to generate a lesson.
 * @fileOverview Defines the GenerateTailoredLessons flow for creating personalized lessons.
 * - generateTailoredLessons - A function that generates tailored lessons based on child's profile.
 * - GenerateTailoredLessonsInput - The input type for the generateTailoredLessons function.
 * - GenerateTailoredLessonsOutput - The return type for the generateTailoredLessons function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTailoredLessonsInputSchema = z.object({
  childName: z.string().describe('The name of the child.'),
  childAge: z.number().describe('The age of the child.'),
  learningDifficulties: z.string().describe('The learning difficulties of the child.'),
  interests: z.string().describe('The interests of the child.'),
  recentMood: z.string().describe('The recent mood of the child (e.g., happy, sad, neutral).'),
  lessonHistory: z.string().describe('A summary of the child\'s previous lessons.'),
});
export type GenerateTailoredLessonsInput = z.infer<typeof GenerateTailoredLessonsInputSchema>;

const GenerateTailoredLessonsOutputSchema = z.object({
  lessonTitle: z.string().describe('The title of the generated lesson.'),
  lessonContent: z.string().describe('The content of the generated lesson.'),
  lessonFormat: z.string().describe('The format of the lesson (e.g., text, video, interactive).'),
  subject: z.string().describe('The subject of the lesson (e.g. Math, English, Science).'),
});
export type GenerateTailoredLessonsOutput = z.infer<typeof GenerateTailoredLessonsOutputSchema>;

export async function generateTailoredLessons(input: GenerateTailoredLessonsInput): Promise<GenerateTailoredLessonsOutput> {
  return generateTailoredLessonsFlow(input);
}

const generateLessonPrompt = ai.definePrompt({
  name: 'generateLessonPrompt',
  input: {schema: GenerateTailoredLessonsInputSchema},
  output: {schema: GenerateTailoredLessonsOutputSchema},
  prompt: `You are an AI assistant designed to create tailored lessons for children with learning difficulties.

  Based on the following information about the child, generate a lesson that is engaging and effective.

  Child Name: {{{childName}}}
  Child Age: {{{childAge}}}
  Learning Difficulties: {{{learningDifficulties}}}
  Interests: {{{interests}}}
  Recent Mood: {{{recentMood}}}
  Lesson History: {{{lessonHistory}}}

  The lesson should have a title, content, format, and subject.

  Please respond in JSON format.
  `,
});

const generateTailoredLessonsFlow = ai.defineFlow(
  {
    name: 'generateTailoredLessonsFlow',
    inputSchema: GenerateTailoredLessonsInputSchema,
    outputSchema: GenerateTailoredLessonsOutputSchema,
  },
  async input => {
    const {output} = await generateLessonPrompt(input);
    return output!;
  }
);
