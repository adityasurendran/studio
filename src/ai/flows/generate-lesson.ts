
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
import { generateImageForSentence, type GenerateImageInput } from './generate-image-for-sentence'; 

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
  lessonHistory: z.string().optional().describe("A summary of the child's previous lessons."),
  lessonTopic: z.string().describe('The specific topic the child should learn about for this lesson.'),
  curriculum: z.string().describe("The child's general curriculum focus."),
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
  name: 'generateLessonTextPrompt', 
  input: {schema: GenerateTailoredLessonsInputSchema},
  output: {schema: z.object({
    lessonTitle: z.string().describe('The title of the generated lesson.'),
    lessonContent: z.array(z.string()).describe('The content of the generated lesson, as an array of individual, concise sentences. Each sentence will be displayed on a separate screen or in pairs.'),
    lessonFormat: z.string().describe('The format of the lesson (e.g., story, quiz, activity, informational).'),
    subject: z.string().describe('The subject of the lesson (e.g. Math, English, Science).'),
  })},
  prompt: `You are an AI assistant designed to create tailored lessons for children with learning difficulties.

  Based on the following information about the child, generate a lesson that is engaging and effective.
  The lesson should be primarily focused on the 'Lesson Topic' provided. If 'Lesson Topic' is general or not very specific, use 'Curriculum Focus' and 'Interests' to enrich the content and make it engaging.

  Child Name: {{{childName}}}
  Child Age: {{{childAge}}}
  Learning Difficulties: {{{learningDifficulties}}}
  Interests: {{{interests}}}
  Recent Mood: {{{recentMood}}}
  Lesson History: {{{lessonHistory}}}
  Curriculum Focus: {{{curriculum}}}
  Lesson Topic: {{{lessonTopic}}}

  The lesson should have a title, content (as an array of sentences), format, and subject.
  
  IMPORTANT: The 'lessonContent' field MUST be a JSON array of strings, where each string is a single, complete, and concise sentence.
  These sentences will be grouped into pairs (or a single sentence if it's the last one and the total is odd) for display with an accompanying image.
  Generate at least 20-30 sentences for a comprehensive lesson. Ensure sentences are short, simple, and appropriate for the child's age and learning difficulties.
  For example: "lessonContent": ["The sun is a star.", "It is very big and hot.", "The sun gives us light.", "It also gives us warmth.", "Plants use sunlight to grow.", "Animals need the sun too.", "The Earth travels around the sun.", "This journey takes one year.", "Sunlight helps us see during the day.", "It makes shadows on the ground.", "Sometimes clouds cover the sun.", "But it is still there, high above.", "We should not look directly at the sun.", "It can hurt our eyes.", "Sunscreen protects our skin from the sun.", "The sun rises in the east.", "It sets in the west.", "Many stories are told about the sun.", "It is a very important star for us.", "Let's learn more about our amazing sun!"]

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
    const { output: textOutput } = await generateLessonPrompt(input);
    if (!textOutput) {
      throw new Error("Failed to generate lesson text. Output was null.");
    }

    let lessonContent = textOutput.lessonContent;
    if (typeof lessonContent === 'string') {
        const contentString = lessonContent as string;
        lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
    } else if (!Array.isArray(lessonContent)) {
        console.warn("Lesson content was not a string or array, defaulting to single sentence:", lessonContent);
        lessonContent = [String(lessonContent)];
    }
     if (lessonContent.length === 0) {
        lessonContent = ["Let's start our lesson! This is a default sentence."]; // Fallback
    }


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
        const imageResult = await generateImageForSentence(imageInput);
        imageDataUri = imageResult.imageDataUri;
      } catch (imgErr) {
        console.error(`Failed to generate image for sentences: "${pageSentences.join(' ')}"`, imgErr);
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

