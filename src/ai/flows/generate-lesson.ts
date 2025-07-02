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
import { logInfo, logError, logWarn } from '@/lib/logger';

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
  curriculum: z.string().describe("The child's general curriculum focus (e.g., 'CBSE Grade 5 Science', 'US Grade 2 Math', 'Irish Junior Cycle Maths', 'UK National Curriculum Year 4 History'). This is critical for content alignment."),
  learningStyle: z.string().optional().describe('The preferred learning style of the child (e.g., visual, auditory, kinesthetic, reading_writing, balanced_mixed).'),
  preferredActivities: z.string().optional().describe('Preferred types of learning activities, e.g., interactive games, storytelling, drawing tasks, building blocks.'),
  targetLanguage: z.string().optional().default('en').describe('The target language for the lesson content (e.g., "en", "es", "fr"). Default is "en".'),
});
export type GenerateTailoredLessonsInput = z.infer<typeof GenerateTailoredLessonsInputSchema>;

const GenerateTailoredLessonsOutputSchema = z.object({
  lessonTitle: z.string().describe('The title of the generated lesson.'),
  lessonPages: z.array(LessonPageSchema).describe('An array of lesson pages, each with sentences and an image URI.'),
  lessonFormat: z.string().describe('The format of the lesson (e.g., story, quiz, activity).'),
  subject: z.string().describe('The subject of the lesson (e.g. Math, English, Science).'),
  quiz: z.array(QuizQuestionSchema).describe('An array of 3-5 multiple-choice quiz questions related to the lesson content.'),
  kinestheticActivities: z.array(z.string()).optional().describe('An array of hands-on activities and games for kinesthetic learners. Each activity should be specific, actionable, and related to the lesson content.'),
  curriculumInfo: z.object({
    summary: z.string(),
    sourceHints: z.array(z.string()).optional(),
    isPlaceholder: z.boolean().optional(),
  }).optional(),
});
export type GenerateTailoredLessonsOutput = z.infer<typeof GenerateTailoredLessonsOutputSchema>;


// --- Tool Definition for Fetching Curriculum Information ---
const FetchCurriculumInfoInputSchema = z.object({
  curriculumName: z.string().describe("The name of the curriculum, e.g., 'CBSE Grade 5 Science', 'US Common Core Grade 3 Math'."),
  lessonTopic: z.string().describe("The specific lesson topic."),
  childAge: z.number().describe("The age of the child, to help scope the search."),
  targetLanguage: z.string().optional().describe("The target language for the search results, if applicable."),
});

const FetchCurriculumInfoOutputSchema = z.object({
  summary: z.string().describe("A summary of relevant curriculum information, learning objectives, key concepts, and typical depth for the specified age, topic, and curriculum. This will be used to generate the lesson."),
  sourceHints: z.array(z.string()).optional().describe("Optional: URLs or names of potential sources used for the summary."),
});

const fetchCurriculumInfoTool = ai.defineTool(
  {
    name: 'fetchCurriculumInfoTool',
    description: 'Fetches and summarizes information about a specific curriculum, topic, and age level from external sources (Google Custom Search) to ensure educational accuracy and depth. Use this tool BEFORE generating lesson content to gather curriculum-specific context.',
    inputSchema: FetchCurriculumInfoInputSchema,
    outputSchema: FetchCurriculumInfoOutputSchema,
  },
  async (input) => {
    logInfo('[fetchCurriculumInfoTool] Called with input:', JSON.stringify(input, null, 2));
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    const placeholderSummary = `Placeholder: Could not fetch live curriculum data. Defaulting to general knowledge for '${input.lessonTopic}' within '${input.curriculumName}' for a ${input.childAge}-year-old. Key concepts likely include basic definitions and examples. Learning objectives would typically cover understanding these basics. The depth should be appropriate for the age, focusing on practical examples. For the actual lesson, ensure to elaborate on these points with engaging content.`;
    const placeholderSources = ["General educational knowledge bases."];

    if (!apiKey || apiKey === "YOUR_GOOGLE_AI_API_KEY" || !cseId || cseId === "YOUR_GOOGLE_CUSTOM_SEARCH_ENGINE_ID") {
      let missingVars = [];
      if (!apiKey || apiKey === "YOUR_GOOGLE_AI_API_KEY") missingVars.push("GOOGLE_API_KEY (ensure Custom Search API is enabled for it)");
      if (!cseId || cseId === "YOUR_GOOGLE_CUSTOM_SEARCH_ENGINE_ID") missingVars.push("GOOGLE_CSE_ID");
      
      logWarn(`[fetchCurriculumInfoTool] Missing or placeholder environment variables: ${missingVars.join(', ')}. The Custom Search API will not be called. Ensure these are set in your .env file. Falling back to placeholder data.`);
      return {
        summary: placeholderSummary,
        sourceHints: placeholderSources,
      };
    }
    logInfo('[fetchCurriculumInfoTool] API Key and CSE ID seem to be configured.');

    const queryParts = [
        `"${input.curriculumName}" syllabus`,
        `"${input.lessonTopic}" for ${input.childAge} year old`,
        `key concepts and learning objectives`,
    ];
    const query = queryParts.join(" ");
    logInfo('[fetchCurriculumInfoTool] Constructed search query:', query);
    
    let searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=3`; // Get top 3 results
    
    if (input.targetLanguage) {
      searchUrl += `&lr=lang_${input.targetLanguage.substring(0,2)}`;
    }
    logInfo('[fetchCurriculumInfoTool] Final search URL:', searchUrl);
    
    try {
      const response = await fetch(searchUrl);
      logInfo('[fetchCurriculumInfoTool] Google Custom Search API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        logError(`[fetchCurriculumInfoTool] Google Custom Search API error: ${response.status} - ${errorText}. Query: ${query}`);
        logInfo(`SERVER LOG: Curriculum Search Error - Could not fetch curriculum data (Status: ${response.status}). Using general knowledge.`);
        return { summary: placeholderSummary, sourceHints: placeholderSources };
      }
      const searchData = await response.json();
      logInfo('[fetchCurriculumInfoTool] Received search data (first item if exists):', searchData.items ? JSON.stringify(searchData.items[0], null, 2) : "No items found");


      if (!searchData.items || searchData.items.length === 0) {
        logWarn(`[fetchCurriculumInfoTool] No search results found for query: ${query}`);
        logInfo("SERVER LOG: Curriculum Search - No specific curriculum details found via search for this topic. Using general knowledge.");
        return { 
            summary: `No specific search results found for '${input.lessonTopic}' within '${input.curriculumName}' for a ${input.childAge}-year-old. The lesson will be based on general knowledge, focusing on foundational concepts appropriate for the age.`, 
            sourceHints: ["General educational knowledge." ]
        };
      }

      const snippets = searchData.items.map((item: any) => `Title: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}`).join("\n\n---\n\n");
      const sourceHints = searchData.items.map((item: any) => `${item.title} (${item.link})`);
      logInfo('[fetchCurriculumInfoTool] Extracted snippets and source hints. Snippet count:', searchData.items.length);

      const summarizationPromptText = `Based on the following search results, provide a concise summary of key concepts, learning objectives, and the typical educational depth and focus for a lesson on "${input.lessonTopic}". This lesson is for a ${input.childAge}-year-old child following the "${input.curriculumName}" curriculum. The lesson should be in ${input.targetLanguage || 'English'}. Be specific and extract actionable information for lesson planning. Search results:\n${snippets}`;
      logInfo('[fetchCurriculumInfoTool] Attempting to summarize snippets. Summarization prompt length:', summarizationPromptText.length);
      
      const { text: summarizedText } = await ai.generate({
        prompt: summarizationPromptText,
        model: 'googleai/gemini-2.0-flash', 
        config: { temperature: 0.3 } 
      });

      if (!summarizedText) {
        logError("[fetchCurriculumInfoTool] Failed to summarize search results. Using raw snippets.");
        logInfo("SERVER LOG: Curriculum Data - Using raw search snippets as AI summarization failed.");
        return { summary: snippets.substring(0, 2000), sourceHints }; // Truncate if too long
      }

      logInfo("[fetchCurriculumInfoTool] Successfully fetched and summarized curriculum info. Summary length:", summarizedText.length);
      return {
        summary: summarizedText,
        sourceHints: sourceHints,
      };

    } catch (error: any) {
      logError(`[fetchCurriculumInfoTool] Error during curriculum search or summarization: ${error.message}`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
      logInfo(`SERVER LOG: Curriculum Search Failed - An error occurred: ${error.message}. Using general knowledge.`);
      return { summary: placeholderSummary, sourceHints: placeholderSources };
    }
  }
);
// --- End Tool Definition ---


const generateLessonPrompt = ai.definePrompt({
  name: 'generateLessonTextAndQuizPrompt', 
  tools: [fetchCurriculumInfoTool], 
  input: {schema: GenerateTailoredLessonsInputSchema},
  output: {schema: z.object({
    lessonTitle: z.string().describe('The title of the generated lesson.'),
    lessonContent: z.array(z.string()).describe('The content of the generated lesson, as an array of individual, concise sentences. Each sentence will be displayed on a separate screen or in pairs.'),
    lessonFormat: z.string().describe('The format of the lesson (e.g., story, quiz, activity, informational).'),
    subject: z.string().describe('The subject of the lesson (e.g. Math, English, Science).'),
    quiz: z.array(QuizQuestionSchema).describe('An array of 3-5 multiple-choice quiz questions, with 2-4 options each, based on the lesson content. Ensure questions are appropriate for the child\'s age and curriculum. Each question MUST include a child-friendly explanation.'),
    kinestheticActivities: z.array(z.string()).optional().describe('An array of hands-on activities and games for kinesthetic learners. Each activity should be specific, actionable, and related to the lesson content.'),
  })},
  prompt: `You are an AI assistant specializing in creating educational content for children. Generate a lesson and a short quiz based on the following child profile:

  Child Name: {{{childName}}}
  Child Age: {{{childAge}}}
  Target Language: {{{targetLanguage}}}
  Learning Difficulties: {{{learningDifficulties}}}
  Interests: {{{interests}}}
  Preferred Activities: {{{preferredActivities}}}
  Recent Mood: {{{recentMood}}}
  Lesson History: {{{lessonHistory}}}
  Curriculum Focus: {{{curriculum}}}
  Lesson Topic: {{{lessonTopic}}}
  Learning Style: {{{learningStyle}}}

  Guidelines:
  - Use the 'fetchCurriculumInfoTool' to get curriculum details.
  - Synthesize the lesson using the tool's info and the child's profile.
  - All output must be in the target language.
  - Adjust complexity for the child's age and learning difficulties.
  - Integrate the child's interests and mood.
  - Lesson format should reflect learning style and preferred activities.

  KINESTHETIC LEARNING:
  If the learning style is 'kinesthetic' or preferred activities include kinesthetic elements (building, experiments, movement, hands-on, etc.), include a "kinestheticActivities" array with 3-5 specific, actionable activities related to the lesson topic. Each should:
  - Be age-appropriate and safe
  - Relate directly to the lesson topic
  - Involve movement, touch, or physical interaction
  - Use common household materials if possible
  - Be clear and step-by-step

  Your output must be a JSON object with: "lessonTitle", "lessonContent" (an array of 10-15 concise sentences), "lessonFormat", "subject", "quiz" (3-5 multiple-choice questions, each with an explanation), and "kinestheticActivities" (if applicable).

  Example:
  {
    "lessonTitle": "The Amazing Journey of Water",
    "lessonContent": [
      "Water is essential for all life.",
      "It exists as solid, liquid, and gas.",
      // ... 10-15 sentences ...
    ],
    "lessonFormat": "Hands-On Adventure",
    "subject": "Science",
    "kinestheticActivities": [
      "Water Cycle Dance: Move like water through its stages.",
      "Mini Water Cycle in a Jar: Observe condensation and precipitation.",
      "Build a Water Cycle Model: Use household items to show the process."
    ],
    "quiz": [
      {
        "questionText": "What are the three states of water?",
        "options": ["Solid, Liquid, Gas", "Ice, Rain, Cloud"],
        "correctAnswerIndex": 0,
        "explanation": "Water can be solid (ice), liquid (water), or gas (vapor)."
      }
      // ... 2-4 more questions ...
    ]
  }

  Please respond ONLY in JSON format matching this structure. Ensure all quiz questions have an explanation and all content is appropriate for the specified age, curriculum, mood, learning style, and preferred activities, and is in the '{{{targetLanguage}}}'.
  `,
});


const generateTailoredLessonsFlow = ai.defineFlow(
  {
    name: 'generateTailoredLessonsFlow',
    inputSchema: GenerateTailoredLessonsInputSchema,
    outputSchema: GenerateTailoredLessonsOutputSchema,
  },
  async (input) => {
    logInfo('[generateTailoredLessonsFlow] Starting internal flow with input:', JSON.stringify(input, null, 2));
    try {
      let textAndQuizOutput;
      
      try {
        logInfo('[generateTailoredLessonsFlow] Calling generateLessonPrompt with input:', JSON.stringify(input, null, 2));
        const result = await generateLessonPrompt(input);
        logInfo('[generateTailoredLessonsFlow] Raw result from generateLessonPrompt:', JSON.stringify(result, null, 2));

        textAndQuizOutput = result.output;
        logInfo('[generateTailoredLessonsFlow] Parsed output from generateLessonPrompt (textAndQuizOutput):', JSON.stringify(textAndQuizOutput, null, 2));

        if (!textAndQuizOutput) {
            logError('[generateTailoredLessonsFlow] CRITICAL: Output from generateLessonPrompt was null or undefined. This indicates a problem with the prompt execution or the AI model response. Input:', JSON.stringify(input, null, 2), 'Raw result from prompt:', JSON.stringify(result, null, 2));
            throw new Error("Failed to generate lesson text and quiz. AI model returned no output from the main prompt.");
        }
        logInfo('[generateTailoredLessonsFlow] Received output from generateLessonPrompt. Title:', textAndQuizOutput.lessonTitle, 'Content sentence count:', textAndQuizOutput.lessonContent?.length, 'Quiz question count:', textAndQuizOutput.quiz?.length);

      } catch (promptError: any) {
        let errorDetails = `Message: ${promptError.message || 'No message'}, Name: ${promptError.name || 'No name'}`;
        if (promptError.stack) { errorDetails += `, Stack: ${promptError.stack}`; }
        try { errorDetails += `, FullErrorObject: ${JSON.stringify(promptError, Object.getOwnPropertyNames(promptError))}`; } 
        catch (e) { errorDetails += `, FullErrorObject: (Unstringifiable)`; }
        logError(`[generateTailoredLessonsFlow] Error directly from generateLessonPrompt execution for topic "${input.lessonTopic}", child age ${input.childAge}: ${errorDetails}`);
        
        if (promptError.message && (promptError.message.includes('fetchCurriculumInfoTool') || promptError.message.includes('tool'))) {
            throw new Error(`Error during curriculum information fetching for topic "${input.lessonTopic}": ${promptError.message}. Please check tool logs and API configurations.`);
        }
        throw new Error(`AI prompt for lesson "${input.lessonTopic}" failed: ${promptError.message || 'Unknown prompt error'}`);
      }
      
      let lessonContent = textAndQuizOutput.lessonContent;
      if (typeof lessonContent === 'string') {
          logWarn('[generateTailoredLessonsFlow] Lesson content was a string, attempting to parse or split. Received string:', lessonContent);
          const contentString = lessonContent as string;
          try {
            const parsed = JSON.parse(contentString);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
              lessonContent = parsed;
              logInfo('[generateTailoredLessonsFlow] Successfully parsed string content into array.');
            } else {
              logWarn('[generateTailoredLessonsFlow] Parsed string content was not an array of strings. Splitting by sentence.');
              lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
            }
          } catch (e) {
            logWarn('[generateTailoredLessonsFlow] Failed to parse string content as JSON. Splitting by sentence. Error:', e);
            lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
          }
          logInfo('[generateTailoredLessonsFlow] Processed string content. New sentence count:', lessonContent.length);
      } else if (!Array.isArray(lessonContent) || !lessonContent.every(item => typeof item === 'string')) {
          logWarn("[generateTailoredLessonsFlow] Lesson content was not a valid array of strings, attempting to coerce. Received (type " + typeof lessonContent + "):", JSON.stringify(lessonContent));
          if (lessonContent && typeof (lessonContent as any).toString === 'function') {
            const singleSentence = (lessonContent as any).toString();
            lessonContent = singleSentence.match(/[^.!?]+[.!?]+/g) || [singleSentence];
          } else {
            lessonContent = ["Default lesson content as the received format was unusable."];
          }
          logInfo('[generateTailoredLessonsFlow] Coerced invalid content into sentence count:', lessonContent.length);
      }
      
      if (lessonContent.length === 0) {
          logWarn("[generateTailoredLessonsFlow] Lesson content array was empty after processing. Using fallback.");
          lessonContent = ["Let's start our lesson! This is a default sentence because content generation was empty."]; 
      }
      
      const imageGenerationPromises: Promise<{ sentences: string[]; imageDataUri: string | null }>[] = [];
      logInfo(`[generateTailoredLessonsFlow] Starting image generation for ${Math.ceil(lessonContent.length / 2)} pairs of sentences for lesson "${textAndQuizOutput.lessonTitle}".`);

      for (let i = 0; i < lessonContent.length; i += 2) {
        const rawSentences = await Promise.all(lessonContent.slice(i, i + 2).map(async s => await cleanSentence(s)));
        const pageSentences = rawSentences.filter(s => s.length > 0);
        
        if (pageSentences.length > 0) {
            logInfo(`[generateTailoredLessonsFlow] Preparing to generate image for sentences: "${pageSentences.join(' ')}"`);
            imageGenerationPromises.push(
            (async () => {
                let imageDataUri: string | null = null;
                try {
                const imageInput: GenerateImageInput = {
                    sentences: pageSentences,
                    childAge: input.childAge,
                    interests: input.interests,
                };
                logInfo(`[generateTailoredLessonsFlow] Calling generateImageForSentence with input:`, JSON.stringify(imageInput));
                const imageResult = await generateImageForSentence(imageInput);
                imageDataUri = imageResult.imageDataUri;
                logInfo(`[generateTailoredLessonsFlow] Image generated successfully for: "${pageSentences.join(' ')}" (URI length: ${imageDataUri?.length})`);
                } catch (imgErr: any) {
                logError(`[generateTailoredLessonsFlow] Failed to generate image for sentences: "${pageSentences.join(' ')}" for lesson "${textAndQuizOutput.lessonTitle}"`, imgErr.message ? imgErr.message : JSON.stringify(imgErr));
                // imageDataUri remains null, allowing the lesson to proceed without this image.
                }
                return { sentences: pageSentences, imageDataUri };
            })()
            );
        }
      }

      const resolvedLessonPages = await Promise.all(imageGenerationPromises);
      logInfo('[generateTailoredLessonsFlow] All image generation promises resolved. Page count:', resolvedLessonPages.length);

      let quiz = textAndQuizOutput.quiz;
      if (!Array.isArray(quiz) || !quiz.every(q => q && typeof q.questionText === 'string' && Array.isArray(q.options) && typeof q.correctAnswerIndex === 'number' && typeof q.explanation === 'string')) {
        logWarn(`[generateTailoredLessonsFlow] Generated quiz data for lesson "${textAndQuizOutput.lessonTitle}" is not in the expected format or is missing explanations. Using an empty quiz. Received:`, JSON.stringify(quiz));
        quiz = []; 
      } else {
        logInfo('[generateTailoredLessonsFlow] Quiz data seems valid. Question count:', quiz.length);
      }

      // Fetch curriculum info directly for UI feedback
      let curriculumInfoResult = null;
      try {
        curriculumInfoResult = await fetchCurriculumInfoTool({
          curriculumName: input.curriculum,
          lessonTopic: input.lessonTopic,
          childAge: input.childAge,
          targetLanguage: input.targetLanguage,
        });
      } catch (e) {
        curriculumInfoResult = null;
      }

      const isPlaceholder = curriculumInfoResult && curriculumInfoResult.summary && curriculumInfoResult.summary.startsWith('Placeholder:');
      const finalOutput = {
        lessonTitle: textAndQuizOutput.lessonTitle || `Lesson on ${input.lessonTopic}`,
        lessonFormat: textAndQuizOutput.lessonFormat || "Informational",
        subject: textAndQuizOutput.subject || "General Knowledge",
        lessonPages: resolvedLessonPages.filter(page => page.sentences.length > 0),
        quiz: quiz,
        kinestheticActivities: textAndQuizOutput.kinestheticActivities || [],
        curriculumInfo: curriculumInfoResult
          ? { ...curriculumInfoResult, isPlaceholder }
          : undefined,
      };
      logInfo('[generateTailoredLessonsFlow] Successfully assembled final lesson output. Title:', finalOutput.lessonTitle, 'Pages:', finalOutput.lessonPages.length, 'Quiz items:', finalOutput.quiz.length, 'Output object keys:', Object.keys(finalOutput).join(', '));
      return finalOutput;

    } catch (flowError: any) {
      let errorDetails = `Message: ${flowError.message || 'No message'}, Name: ${flowError.name || 'No name'}`;
      if (flowError.stack) { errorDetails += `, Stack: ${flowError.stack}`; }
      try { errorDetails += `, FullErrorObject: ${JSON.stringify(flowError, Object.getOwnPropertyNames(flowError))}`; } 
      catch (e) { errorDetails += `, FullErrorObject: (Unstringifiable)`; }
      logError(`[generateTailoredLessonsFlow] CRITICAL error during main lesson generation flow for topic "${input.lessonTopic}", child age ${input.childAge}: ${errorDetails}`);
      
      let errorMessage = "Lesson generation failed due to an internal server error.";

      if (flowError && flowError.message) {
        errorMessage = String(flowError.message);
      } else if (flowError && flowError.details) { 
        errorMessage = String(flowError.details);
      } else if (typeof flowError === 'string') {
        errorMessage = flowError;
      } else {
         try {
          errorMessage = `Lesson generation failed with an unstringifiable error object. Raw error: ${JSON.stringify(flowError, Object.getOwnPropertyNames(flowError))}`;
        } catch (e) {
          errorMessage = "Lesson generation failed due to an unstringifiable error object and the error object itself could not be stringified.";
        }
      }
      
      const errorStringLower = errorMessage.toLowerCase();
      if (errorStringLower.includes("api key") || errorStringLower.includes("permission denied") || errorStringLower.includes("authentication") || errorStringLower.includes("quota") || errorStringLower.includes("billing")) {
         errorMessage = `Lesson generation failed (topic: "${input.lessonTopic}"): There might be an issue with the Google AI API Key configuration, permissions, or billing. Please check server logs and your Google Cloud/AI Studio project. Original error: ${errorMessage}`;
      } else if (errorStringLower.includes("failed to parse") || errorStringLower.includes("json format")) {
        errorMessage = `Lesson generation failed (topic: "${input.lessonTopic}"): The AI model's response was not in the expected format. Please try again. Original error: ${errorMessage}`;
      } else if (errorStringLower.includes("tool") && (errorStringLower.includes("error") || errorStringLower.includes("failed"))) {
        errorMessage = `Lesson generation failed (topic: "${input.lessonTopic}"): There was an issue using the curriculum research tool. This could be due to the tool's placeholder implementation or an internal error. Original error: ${errorMessage}`;
      } else if (errorStringLower.includes("model") && (errorStringLower.includes("error") || errorStringLower.includes("failed") || errorStringLower.includes("unavailable"))) {
        errorMessage = `Lesson generation failed (topic: "${input.lessonTopic}"): There seems to be an issue with the AI model itself. Please try again later. Original error: ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }
  }
);

export async function generateTailoredLessons(input: GenerateTailoredLessonsInput): Promise<GenerateTailoredLessonsOutput> {
  logInfo('[generateTailoredLessons wrapper] Called with input:', JSON.stringify(input, null, 2));
  try {
    const result = await generateTailoredLessonsFlow(input);
    logInfo('[generateTailoredLessons wrapper] Successfully generated lesson. Title:', result.lessonTitle);
    return result;
  } catch (error: any) {
    let errorDetails = `Message: ${error.message || 'No message'}, Name: ${error.name || 'No name'}`;
    if (error.stack) { errorDetails += `, Stack: ${error.stack}`; }
    try { errorDetails += `, FullErrorObject: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`; } 
    catch (e) { errorDetails += `, FullErrorObject: (Unstringifiable)`; }
    logError(`[generateTailoredLessons wrapper] Error during lesson generation flow for topic "${input.lessonTopic}", child age ${input.childAge}: ${errorDetails}`);

    let userFriendlyMessage = `Failed to generate lesson for topic "${input.lessonTopic}". `;
    if (error && error.message) {
        const lowerCaseMessage = error.message.toLowerCase();
        if (lowerCaseMessage.includes("api key") || lowerCaseMessage.includes("permission denied") || lowerCaseMessage.includes("billing")) {
            userFriendlyMessage += "There might be an issue with the API configuration or billing. Please check server logs.";
        } else if (lowerCaseMessage.includes("model") && (lowerCaseMessage.includes("error") || lowerCaseMessage.includes("failed"))) {
            userFriendlyMessage += "The AI model encountered an issue. Please try again later.";
        } else if (lowerCaseMessage.includes("curriculum") || lowerCaseMessage.includes("tool")) {
            userFriendlyMessage += "There was an issue fetching curriculum information. Please check server logs or try a different topic.";
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

export async function cleanSentence(sentence: string): Promise<string> {
    let cleaned = sentence.trim();
    if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
        cleaned += '.';
    }
    if (cleaned.length > 0 && cleaned[0] !== cleaned[0].toUpperCase()) {
        cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
    }
    return cleaned;
}
    
