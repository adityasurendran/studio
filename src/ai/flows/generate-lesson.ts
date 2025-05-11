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
  prompt: `You are an AI assistant specializing in creating educational content for children, including those with learning difficulties. Your task is to generate a detailed and informative lesson.

  The lesson MUST be tailored to the child's specific profile:
    Child Name: {{{childName}}}
    Child Age: {{{childAge}}} (Ensure the complexity of language and concepts are appropriate for this age.)
    Learning Difficulties: {{{learningDifficulties}}} (Simplify explanations and use clear, direct language if difficulties are specified.)
    Interests: {{{interests}}} (Incorporate these interests to make the lesson more engaging, if relevant to the topic.)
    Recent Mood: {{{recentMood}}} (Adjust the tone of the lesson slightly to be sensitive to the child's mood.)
    Lesson History: {{{lessonHistory}}} (Avoid repetition if possible, build upon previous knowledge if relevant.)
    Curriculum Focus: {{{curriculum}}} (This is a key guideline. The lesson's content, depth, and terminology should align with this curriculum standard. For example, if 'CBSE Grade 5 Science' or 'US Grade 2 Math' is specified, ensure the lesson reflects the appropriate level of detail and topics typically covered in that curriculum for the given 'Lesson Topic'.)
    Lesson Topic: {{{lessonTopic}}} (The lesson MUST comprehensively teach this specific topic.)

  Your output must be a JSON object with the following fields: "lessonTitle", "lessonContent" (an array of concise sentences), "lessonFormat", and "subject".
  
  IMPORTANT:
  1.  Educational Depth: The lesson must be sufficiently informative and educational for a child of {{{childAge}}} following the {{{curriculum}}} curriculum. It should not be overly simplistic if the age and curriculum suggest more complex understanding.
  2.  Lesson Content: 'lessonContent' MUST be a JSON array of strings. Each string should be a single, complete, and concise sentence.
  3.  Sentence Count: Generate a substantial lesson with AT LEAST 25-35 sentences. These sentences will be grouped (1 or 2 per screen) with an image. Ensure each sentence is easy to understand, even if the topic is complex, by breaking down information.
  4.  Relevance: All content MUST directly relate to teaching the 'Lesson Topic': {{{lessonTopic}}} in a manner consistent with the specified 'Curriculum Focus'.
  5.  Tone: Maintain an encouraging and child-friendly tone.

  Example (If lesson topic is "The Water Cycle", age is 10, curriculum is "CBSE Grade 5 Environmental Science"):
  "lessonContent": [
    "Water is one of the most precious resources on our planet, essential for all forms of life.",
    "It exists in three main states, or forms: solid, liquid, and gas.",
    "As a solid, we know water as ice, like in glaciers, ice caps, or even the ice cubes in your drink.",
    "Water in its liquid state fills our rivers, lakes, and vast oceans, and it's what we drink.",
    "When water is heated, it transforms into a gas called water vapor, which is invisible to our eyes.",
    "The continuous movement of water on, above, and below the surface of the Earth is called the water cycle, or hydrological cycle.",
    "This cycle is driven primarily by energy from the sun and by gravity.",
    "The first major step in the water cycle is evaporation.",
    "Evaporation occurs when the sun's heat warms up surface water in oceans, lakes, and rivers, turning it into water vapor.",
    "This water vapor then rises into the atmosphere.",
    "Plants also release water vapor into the atmosphere through a process called transpiration.",
    "As the water vapor rises higher, the air temperature gets colder.",
    "This cooling causes the water vapor to change back into tiny liquid water droplets or ice crystals.",
    "This process is known as condensation, and it's how clouds are formed.",
    "Clouds are essentially large collections of these water droplets or ice crystals.",
    "When these droplets or crystals in the clouds grow large and heavy enough, gravity pulls them back down to Earth.",
    "This is called precipitation, and it can take various forms like rain, snow, sleet, or hail, depending on atmospheric conditions.",
    "Once water reaches the ground, some of it flows over the land as surface runoff, collecting in rivers, lakes, and eventually oceans.",
    "Some precipitation soaks into the ground, a process called infiltration.",
    "This infiltrated water can become groundwater, stored in underground layers of rock and soil called aquifers.",
    "Groundwater can slowly move and eventually seep back into surface water bodies or be taken up by plants.",
    "The water cycle is a vital natural process that purifies water and distributes it across the globe.",
    "It ensures a continuous supply of fresh water, which is crucial for drinking, agriculture, and supporting ecosystems.",
    "Human activities, like deforestation and pollution, can significantly impact the water cycle.",
    "It's important to conserve water and protect our water sources to maintain a healthy water cycle.",
    "Understanding the water cycle helps us appreciate the interconnectedness of Earth's systems and the importance of water conservation."
  ]

  Please respond ONLY in JSON format.
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
      // Basic validation and cleanup for lessonContent
      if (typeof lessonContent === 'string') {
          const contentString = lessonContent as string;
          // Try to parse if it's a JSON string array
          try {
            const parsed = JSON.parse(contentString);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
              lessonContent = parsed;
            } else {
              // If not a JSON array string, split by sentences. This is a fallback.
              lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
            }
          } catch (e) {
            // If JSON.parse fails, assume it's a single block of text to be split.
             lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
          }
      } else if (!Array.isArray(lessonContent) || !lessonContent.every(item => typeof item === 'string')) {
          console.warn("Lesson content was not a valid array of strings, attempting to coerce. Received:", lessonContent);
          if (lessonContent && typeof (lessonContent as any).toString === 'function') {
            const singleSentence = (lessonContent as any).toString();
            lessonContent = singleSentence.match(/[^.!?]+[.!?]+/g) || [singleSentence];
          } else {
            lessonContent = ["Default lesson content as the received format was unusable."];
          }
      }
      
      if (lessonContent.length === 0) {
          console.warn("Lesson content array was empty after processing. Using fallback.");
          lessonContent = ["Let's start our lesson! This is a default sentence because content generation was empty."]; 
      }
      
      const imageGenerationPromises: Promise<{ sentences: string[]; imageDataUri: string | null }>[] = [];

      for (let i = 0; i < lessonContent.length; i += 2) {
        const pageSentences = lessonContent.slice(i, i + 2).map(s => cleanSentence(s)).filter(s => s.length > 0);
        
        if (pageSentences.length > 0) {
            imageGenerationPromises.push(
            (async () => {
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
                console.error(`[generateTailoredLessonsFlow] Failed to generate image for sentences: "${pageSentences.join(' ')}"`, imgErr.message ? imgErr.message : imgErr);
                // imageDataUri remains null, which is acceptable
                }
                return { sentences: pageSentences, imageDataUri };
            })()
            );
        }
      }

      const resolvedLessonPages = await Promise.all(imageGenerationPromises);

      return {
        lessonTitle: textOutput.lessonTitle || `Lesson on ${input.lessonTopic}`,
        lessonFormat: textOutput.lessonFormat || "Informational",
        subject: textOutput.subject || "General Knowledge",
        lessonPages: resolvedLessonPages.filter(page => page.sentences.length > 0), // Ensure no empty pages
      };
    } catch (error: any) {
      console.error("[generateTailoredLessonsFlow] Error during lesson generation:", error);
      let errorMessage = "Lesson generation failed due to an internal server error.";

      if (error && error.message) {
        errorMessage = String(error.message);
      } else if (error && error.details) { 
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
      // More specific error handling for flow execution or model output issues
      if (errorString.includes("failed to parse") || errorString.includes("json format")) {
        errorMessage = `Lesson generation failed: The AI model's response was not in the expected format. Please try again. Original error: ${errorMessage}`;
      }

      throw new Error(errorMessage);
    }
  }
);

export async function generateTailoredLessons(input: GenerateTailoredLessonsInput): Promise<GenerateTailoredLessonsOutput> {
  return generateTailoredLessonsFlow(input);
}

// Helper for basic sentence cleanup
function cleanSentence(sentence: string): string {
    // Trim whitespace
    let cleaned = sentence.trim();
    // Ensure it ends with a punctuation mark if it's not empty
    if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
        cleaned += '.';
    }
    // Capitalize first letter if it's not already
    if (cleaned.length > 0 && cleaned[0] !== cleaned[0].toUpperCase()) {
        cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
    }
    return cleaned;
}
