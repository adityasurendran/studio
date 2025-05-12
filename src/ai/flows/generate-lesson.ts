// src/ai/flows/generate-lesson.ts
'use server';

/**
 * @fileOverview Defines the GenerateTailoredLessons flow for creating personalized lessons including a quiz.
 * - generateTailoredLessons - A function that generates tailored lessons (text, images) and a quiz.
 * - GenerateTailoredLessonsInput - The input type for the generateTailoredLessons function.
 * - GenerateTailoredLessonsOutput - The return type for the generateTailoredLessons function.
 * - QuizQuestion - The type for a single quiz question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateImageForSentence, type GenerateImageInput } from './generate-image-for-sentence'; 

const QuizQuestionSchema = z.object({
  questionText: z.string().describe("The text of the quiz question."),
  options: z.array(z.string()).min(2).max(4).describe("An array of 2 to 4 answer options."),
  correctAnswerIndex: z.number().int().min(0).describe("The 0-based index of the correct answer in the 'options' array."),
  explanation: z.string().describe("A brief, child-friendly explanation for why the correct answer is right, and potentially why other common distractors are wrong. This explanation will be shown if the child answers incorrectly."),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

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
  curriculum: z.string().describe("The child's general curriculum focus (e.g., 'CBSE Grade 5 Science', 'US Grade 2 Math', 'Irish Junior Cycle Maths'). This is critical for content alignment."),
});
export type GenerateTailoredLessonsInput = z.infer<typeof GenerateTailoredLessonsInputSchema>;

const GenerateTailoredLessonsOutputSchema = z.object({
  lessonTitle: z.string().describe('The title of the generated lesson.'),
  lessonPages: z.array(LessonPageSchema).describe('An array of lesson pages, each with sentences and an image URI.'),
  lessonFormat: z.string().describe('The format of the lesson (e.g., story, quiz, activity).'),
  subject: z.string().describe('The subject of the lesson (e.g. Math, English, Science).'),
  quiz: z.array(QuizQuestionSchema).describe('An array of 3-5 multiple-choice quiz questions related to the lesson content.'),
});
export type GenerateTailoredLessonsOutput = z.infer<typeof GenerateTailoredLessonsOutputSchema>;

const generateLessonPrompt = ai.definePrompt({
  name: 'generateLessonTextAndQuizPrompt', 
  input: {schema: GenerateTailoredLessonsInputSchema},
  output: {schema: z.object({
    lessonTitle: z.string().describe('The title of the generated lesson.'),
    lessonContent: z.array(z.string()).describe('The content of the generated lesson, as an array of individual, concise sentences. Each sentence will be displayed on a separate screen or in pairs.'),
    lessonFormat: z.string().describe('The format of the lesson (e.g., story, quiz, activity, informational).'),
    subject: z.string().describe('The subject of the lesson (e.g. Math, English, Science).'),
    quiz: z.array(QuizQuestionSchema).describe('An array of 3-5 multiple-choice quiz questions, with 2-4 options each, based on the lesson content. Ensure questions are appropriate for the child\'s age and curriculum. Each question MUST include a child-friendly explanation.'),
  })},
  prompt: `You are an AI assistant specializing in creating educational content for children, including those with learning difficulties. Your task is to generate a detailed and informative lesson AND a short quiz based on that lesson.

  The lesson MUST be tailored to the child's specific profile:
    Child Name: {{{childName}}}
    Child Age: {{{childAge}}} (Ensure the complexity of language, concepts, and quiz questions are appropriate for this age.)
    Learning Difficulties: {{{learningDifficulties}}} (Simplify explanations and use clear, direct language for both lesson and quiz if difficulties are specified.)
    Interests: {{{interests}}} (Incorporate these interests to make the lesson and quiz more engaging, if relevant to the topic.)
    Recent Mood: {{{recentMood}}} (This is an important instruction. You MUST adjust the tone of the lesson content and quiz questions to be appropriately sensitive to the child's mood. For example, if the mood is 'sad' or 'anxious', the tone should be gentler, more patient, and reassuring. If the mood is 'happy' or 'excited', the tone can be more upbeat and enthusiastic while still maintaining educational focus.)
    Lesson History: {{{lessonHistory}}} (Avoid repetition if possible, build upon previous knowledge if relevant.)
    Curriculum Focus: {{{curriculum}}} (This is a CRITICAL guideline. The lesson content, depth, terminology, and quiz questions must align with this curriculum standard. For example, if 'CBSE Grade 5 Science', 'US Grade 2 Math', or 'Irish Junior Cycle Maths' is specified, ensure the lesson and quiz reflect the appropriate level of detail and topics typically covered in that curriculum for the given 'Lesson Topic'.)
    Lesson Topic: {{{lessonTopic}}} (The lesson MUST comprehensively teach this specific topic, and the quiz MUST test understanding of this topic.)

  Your output must be a JSON object with the following fields: "lessonTitle", "lessonContent" (an array of concise sentences), "lessonFormat", "subject", AND "quiz".
  The "quiz" field must be an array of 3 to 5 multiple-choice question objects. Each question object should have:
    - "questionText": string (The question itself)
    - "options": string[] (An array of 2 to 4 answer choices)
    - "correctAnswerIndex": number (The 0-based index of the correct answer within the "options" array)
    - "explanation": string (MANDATORY: A brief, child-friendly explanation for why the correct answer is right and, if applicable, why common distractors might be incorrect. This explanation will be shown to the child if they answer incorrectly.)

  IMPORTANT:
  1.  Educational Depth & Curriculum Alignment:
      - The lesson MUST be sufficiently informative and educational for a child of {{{childAge}}} following the {{{curriculum}}} for the specified {{{lessonTopic}}}.
      - Imagine you have access to the official textbooks, learning materials, syllabi, and past examination papers for the '{{{curriculum}}}'.
      - The content, depth, terminology, examples, and quiz questions you generate MUST closely mirror what would be found in those official resources for a child of {{{childAge}}} learning about '{{{lessonTopic}}}'.
      - For instance, if '{{{curriculum}}}' is "CBSE Grade 5 Science" and '{{{lessonTopic}}}' is "Photosynthesis," the lesson should teach concepts and use examples as a CBSE Grade 5 Science textbook would. Quiz questions should be similar in style and difficulty to what a student might encounter in CBSE assessments for that grade and topic.
      - If '{{{curriculum}}}' is "Irish Junior Cycle Maths" and '{{{lessonTopic}}}' is "Solving Linear Equations," your lesson should reflect the approach, problem types, and terminology found in Junior Cycle Maths textbooks and past papers for Ireland.
      - The lesson should not be overly simplistic and must cover the topic comprehensively according to the specified curriculum's standards.
  2.  Lesson Content: 'lessonContent' MUST be a JSON array of strings. Each string should be a single, complete, and concise sentence. These sentences will be paired with images.
  3.  Sentence Count: Generate a substantial lesson with AT LEAST 25-35 sentences to ensure comprehensive coverage of the {{{lessonTopic}}}. For a 10-year-old on a CBSE curriculum, this count is critical for adequate depth. Ensure these sentences are distinct and cover different aspects of the topic rather than being repetitive.
  4.  Quiz Quality:
      - Generate 3-5 unique multiple-choice questions.
      - Each question must have between 2 and 4 plausible answer options.
      - Ensure one option is clearly correct based on the lesson content.
      - Questions should directly assess understanding of the material taught in 'lessonContent' and be aligned with the specified '{{{curriculum}}}' standards.
      - Vary question difficulty appropriately for the child's age and curriculum.
      - EACH quiz question MUST have an "explanation" field, as described above.
  5.  Relevance: All content (lesson and quiz) MUST directly relate to teaching the 'Lesson Topic': {{{lessonTopic}}} in a manner consistent with the specified 'Curriculum Focus' ({{{curriculum}}}) and 'Child Age' ({{{childAge}}}).
  6.  Tone: Maintain an encouraging, positive, and child-friendly tone throughout the lesson and quiz, further modulated by the 'Recent Mood' instruction.

  Example (If lesson topic is "The Water Cycle", age is 10, curriculum is "CBSE Grade 5 Environmental Science", mood is "neutral"):
  {
    "lessonTitle": "The Amazing Journey of Water: The Water Cycle",
    "lessonContent": [
      "Water is one of the most precious resources on our planet, essential for all forms of life.",
      "It exists in three main states, or forms: solid, liquid, and gas, as per CBSE Grade 5 science syllabus.",
      "As a solid, we know water as ice, like in glaciers, ice caps, or even the ice cubes in your drink.",
      "Water in its liquid state fills our rivers, lakes, and vast oceans, and it's what we drink.",
      "When water is heated, it transforms into a gas called water vapor, which is invisible to our eyes.",
      "The continuous movement of water on, above, and below the surface of the Earth is called the water cycle, or hydrological cycle. This is a key concept in environmental science.",
      "This cycle is driven primarily by energy from the sun and by gravity.",
      "The first major step in the water cycle is evaporation, a term you'll find in your science textbooks.",
      "Evaporation occurs when the sun's heat warms up surface water in oceans, lakes, and rivers, turning it into water vapor.",
      "This water vapor then rises into the atmosphere.",
      "Plants also release water vapor into the atmosphere through a process called transpiration; think of it as plants 'breathing out' water.",
      "As the water vapor rises higher, the air temperature gets colder, a fundamental principle of atmospheric science.",
      "This cooling causes the water vapor to change back into tiny liquid water droplets or ice crystals.",
      "This process is known as condensation, and it's how clouds are formed. You can see condensation on a cold glass of water too!",
      "Clouds are essentially large collections of these water droplets or ice crystals, floating in the sky.",
      "When these droplets or crystals in the clouds grow large and heavy enough, gravity pulls them back down to Earth.",
      "This is called precipitation, and it can take various forms like rain, snow, sleet, or hail, depending on atmospheric conditions.",
      "Once water reaches the ground, some of it flows over the land as surface runoff, collecting in rivers, lakes, and eventually oceans.",
      "Some precipitation soaks into the ground, a process called infiltration, which is important for replenishing groundwater.",
      "This infiltrated water can become groundwater, stored in underground layers of rock and soil called aquifers.",
      "Groundwater can slowly move and eventually seep back into surface water bodies or be taken up by plants.",
      "The water cycle is a vital natural process that purifies water and distributes it across the globe, a concept often tested in exams.",
      "It ensures a continuous supply of fresh water, which is crucial for drinking, agriculture, and supporting ecosystems.",
      "Human activities, like deforestation and pollution, can significantly impact the water cycle by altering evaporation rates and water quality.",
      "It's important to conserve water and protect our water sources to maintain a healthy water cycle for future generations.",
      "Understanding the water cycle helps us appreciate the interconnectedness of Earth's systems and the importance of water conservation, as emphasized in the CBSE curriculum."
    ],
    "lessonFormat": "Informational Story with Curriculum Links",
    "subject": "Environmental Science (CBSE Aligned)",
    "quiz": [
      {
        "questionText": "According to your CBSE science understanding, what are the three main states of water?",
        "options": ["Solid, Liquid, Air", "Ice, Rain, Cloud", "Solid, Liquid, Gas", "Vapor, Mist, Dew"],
        "correctAnswerIndex": 2,
        "explanation": "Water exists as a solid (like ice, snow), a liquid (like the water we drink or in rivers), and a gas (like water vapor, which is invisible steam in the air). These are the three fundamental states of matter water takes on Earth, as covered in your science books."
      },
      {
        "questionText": "What is the process called when the sun's heat turns water into water vapor, a key part of the water cycle?",
        "options": ["Condensation", "Precipitation", "Evaporation", "Infiltration"],
        "correctAnswerIndex": 2,
        "explanation": "Evaporation is when liquid water gets enough energy, usually from the sun, to turn into a gas called water vapor and rise into the air. Think of a puddle drying up on a sunny day! This is a core concept in the water cycle."
      },
      {
        "questionText": "Which human activity can negatively impact the water cycle, a topic often discussed in environmental studies?",
        "options": ["Planting trees (afforestation)", "Conserving water", "Deforestation (cutting down trees)", "Building rainwater harvesting systems"],
        "correctAnswerIndex": 2,
        "explanation": "Deforestation, which is cutting down large numbers of trees, can harm the water cycle. Trees help release water vapor (transpiration) and their roots help water soak into the ground. Without them, there can be less rain and more runoff, disrupting the natural balance."
      }
    ]
  }

  Please respond ONLY in JSON format matching this structure. Ensure all quiz questions have an explanation and all content is appropriate for the specified age, curriculum, and mood.
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
      const { output: textAndQuizOutput } = await generateLessonPrompt(input);
      if (!textAndQuizOutput) {
        throw new Error("Failed to generate lesson text and quiz. Output was null or undefined from the AI model.");
      }

      let lessonContent = textAndQuizOutput.lessonContent;
      if (typeof lessonContent === 'string') {
          const contentString = lessonContent as string;
          try {
            const parsed = JSON.parse(contentString);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
              lessonContent = parsed;
            } else {
              lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
            }
          } catch (e) {
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
                }
                return { sentences: pageSentences, imageDataUri };
            })()
            );
        }
      }

      const resolvedLessonPages = await Promise.all(imageGenerationPromises);

      let quiz = textAndQuizOutput.quiz;
      if (!Array.isArray(quiz) || !quiz.every(q => q && typeof q.questionText === 'string' && Array.isArray(q.options) && typeof q.correctAnswerIndex === 'number' && typeof q.explanation === 'string')) {
        console.warn("Generated quiz data is not in the expected format or is missing explanations. Using an empty quiz. Received:", quiz);
        quiz = []; // Default to empty quiz if format is incorrect or explanations are missing
      }


      return {
        lessonTitle: textAndQuizOutput.lessonTitle || `Lesson on ${input.lessonTopic}`,
        lessonFormat: textAndQuizOutput.lessonFormat || "Informational",
        subject: textAndQuizOutput.subject || "General Knowledge",
        lessonPages: resolvedLessonPages.filter(page => page.sentences.length > 0),
        quiz: quiz,
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

function cleanSentence(sentence: string): string {
    let cleaned = sentence.trim();
    // Ensure sentence ends with punctuation, but don't add if it already has one of . ! ?
    if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
        cleaned += '.';
    }
    // Capitalize first letter if it's not already
    if (cleaned.length > 0 && cleaned[0] !== cleaned[0].toUpperCase()) {
        cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
    }
    return cleaned;
}

    