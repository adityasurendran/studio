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
  The lesson should be primarily focused on the 'Lesson Topic' provided. Use 'Curriculum Focus', 'Interests', and 'Child Age' to make the content age-appropriate, engaging, and aligned with their learning path.

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
  Generate AT LEAST 20-30 sentences to create a comprehensive lesson. Ensure sentences are short, simple, and appropriate for the child's age ({{{childAge}}}) and learning difficulties.
  The lesson MUST directly address and teach the 'Lesson Topic': {{{lessonTopic}}}.

  For example, if lesson topic is "The Water Cycle": "lessonContent": ["Water is all around us.", "It can be a liquid, like in a lake.", "It can be a solid, like ice.", "It can be a gas, like steam.", "This is called the water cycle.", "The sun heats up water in rivers and lakes.", "The water turns into vapor, an invisible gas.", "This is called evaporation.", "The vapor rises into the sky.", "Up high, the vapor cools down.", "It turns back into tiny water droplets.", "This is called condensation.", "These droplets form clouds.", "When clouds get heavy, water falls back to Earth.", "This can be rain, snow, or hail.", "This is called precipitation.", "The water collects in rivers, lakes, and oceans.", "Then the cycle starts all over again!", "The water cycle is very important for life.", "All plants and animals need water."]

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
    try {
      const { output: textOutput } = await generateLessonPrompt(input);
      if (!textOutput) {
        throw new Error("Failed to generate lesson text. Output was null or undefined from the AI model.");
      }

      let lessonContent = textOutput.lessonContent;
      if (typeof lessonContent === 'string') {
          const contentString = lessonContent as string;
          lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
      } else if (!Array.isArray(lessonContent)) {
          console.warn("Lesson content was not a string or array, defaulting to single sentence. Received:", lessonContent);
          lessonContent = [String(lessonContent || "Default lesson content.")];
      }
      if (lessonContent.length === 0) {
          console.warn("Lesson content array was empty. Using fallback.");
          lessonContent = ["Let's start our lesson! This is a default sentence because content generation was empty."]; 
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
        } catch (imgErr: any) {
          console.error(`Failed to generate image for sentences: "${pageSentences.join(' ')}"`, imgErr);
        }
        lessonPages.push({ sentences: pageSentences, imageDataUri });
      }

      return {
        lessonTitle: textOutput.lessonTitle || `Lesson on ${input.lessonTopic}`,
        lessonFormat: textOutput.lessonFormat || "Informational",
        subject: textOutput.subject || "General Knowledge",
        lessonPages,
      };
    } catch (error: any) {
      console.error("[generateTailoredLessonsFlow] Error during lesson generation:", error);
      let errorMessage = "Lesson generation failed due to an internal server error.";

      if (error && error.message) {
        errorMessage = String(error.message);
      } else if (error && error.details) { // Attempt to capture more specific error details
        errorMessage = String(error.details);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
         try {
          errorMessage = `Lesson generation failed with an unstringifiable error object. Raw error: ${JSON.stringify(error)}`;
        } catch (e) {
          errorMessage = "Lesson generation failed due to an unstringifiable error object and the error object itself could not be stringified.";
        }
      }
      
      const errorString = errorMessage.toLowerCase();
      if (errorString.includes("api key") || errorString.includes("permission denied") || errorString.includes("authentication") || errorString.includes("quota") || errorString.includes("billing")) {
         errorMessage = `Lesson generation failed: There might be an issue with the Google AI API Key configuration, permissions, or billing. Please check server logs and your Google Cloud/AI Studio project. Original error: ${errorMessage}`;
      }
      throw new Error(errorMessage);
    }
  }
);

export async function generateTailoredLessons(input: GenerateTailoredLessonsInput): Promise<GenerateTailoredLessonsOutput> {
  return generateTailoredLessonsFlow(input);
}
