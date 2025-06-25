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
    console.log('[fetchCurriculumInfoTool] Called with input:', JSON.stringify(input, null, 2));
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;

    const placeholderSummary = `Placeholder: Could not fetch live curriculum data. Defaulting to general knowledge for '${input.lessonTopic}' within '${input.curriculumName}' for a ${input.childAge}-year-old. Key concepts likely include basic definitions and examples. Learning objectives would typically cover understanding these basics. The depth should be appropriate for the age, focusing on practical examples. For the actual lesson, ensure to elaborate on these points with engaging content.`;
    const placeholderSources = ["General educational knowledge bases."];

    if (!apiKey || apiKey === "YOUR_GOOGLE_AI_API_KEY" || !cseId || cseId === "YOUR_GOOGLE_CUSTOM_SEARCH_ENGINE_ID") {
      let missingVars = [];
      if (!apiKey || apiKey === "YOUR_GOOGLE_AI_API_KEY") missingVars.push("GOOGLE_API_KEY (ensure Custom Search API is enabled for it)");
      if (!cseId || cseId === "YOUR_GOOGLE_CUSTOM_SEARCH_ENGINE_ID") missingVars.push("GOOGLE_CSE_ID");
      
      console.warn(`[fetchCurriculumInfoTool] Missing or placeholder environment variables: ${missingVars.join(', ')}. The Custom Search API will not be called. Ensure these are set in your .env file. Falling back to placeholder data.`);
      return {
        summary: placeholderSummary,
        sourceHints: placeholderSources,
      };
    }
    console.log('[fetchCurriculumInfoTool] API Key and CSE ID seem to be configured.');

    const queryParts = [
        `"${input.curriculumName}" syllabus`,
        `"${input.lessonTopic}" for ${input.childAge} year old`,
        `key concepts and learning objectives`,
    ];
    const query = queryParts.join(" ");
    console.log('[fetchCurriculumInfoTool] Constructed search query:', query);
    
    let searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=3`; // Get top 3 results
    
    if (input.targetLanguage) {
      searchUrl += `&lr=lang_${input.targetLanguage.substring(0,2)}`;
    }
    console.log('[fetchCurriculumInfoTool] Final search URL:', searchUrl);
    
    try {
      const response = await fetch(searchUrl);
      console.log('[fetchCurriculumInfoTool] Google Custom Search API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[fetchCurriculumInfoTool] Google Custom Search API error: ${response.status} - ${errorText}. Query: ${query}`);
        console.log(`SERVER LOG: Curriculum Search Error - Could not fetch curriculum data (Status: ${response.status}). Using general knowledge.`);
        return { summary: placeholderSummary, sourceHints: placeholderSources };
      }
      const searchData = await response.json();
      console.log('[fetchCurriculumInfoTool] Received search data (first item if exists):', searchData.items ? JSON.stringify(searchData.items[0], null, 2) : "No items found");


      if (!searchData.items || searchData.items.length === 0) {
        console.warn(`[fetchCurriculumInfoTool] No search results found for query: ${query}`);
        console.log("SERVER LOG: Curriculum Search - No specific curriculum details found via search for this topic. Using general knowledge.");
        return { 
            summary: `No specific search results found for '${input.lessonTopic}' within '${input.curriculumName}' for a ${input.childAge}-year-old. The lesson will be based on general knowledge, focusing on foundational concepts appropriate for the age.`, 
            sourceHints: ["General educational knowledge." ]
        };
      }

      const snippets = searchData.items.map((item: any) => `Title: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}`).join("\n\n---\n\n");
      const sourceHints = searchData.items.map((item: any) => `${item.title} (${item.link})`);
      console.log('[fetchCurriculumInfoTool] Extracted snippets and source hints. Snippet count:', searchData.items.length);

      const summarizationPromptText = `Based on the following search results, provide a concise summary of key concepts, learning objectives, and the typical educational depth and focus for a lesson on "${input.lessonTopic}". This lesson is for a ${input.childAge}-year-old child following the "${input.curriculumName}" curriculum. The lesson should be in ${input.targetLanguage || 'English'}. Be specific and extract actionable information for lesson planning. Search results:\n${snippets}`;
      console.log('[fetchCurriculumInfoTool] Attempting to summarize snippets. Summarization prompt length:', summarizationPromptText.length);
      
      const { text: summarizedText } = await ai.generate({
        prompt: summarizationPromptText,
        model: 'googleai/gemini-2.0-flash', 
        config: { temperature: 0.3 } 
      });

      if (!summarizedText) {
        console.error("[fetchCurriculumInfoTool] Failed to summarize search results. Using raw snippets.");
        console.log("SERVER LOG: Curriculum Data - Using raw search snippets as AI summarization failed.");
        return { summary: snippets.substring(0, 2000), sourceHints }; // Truncate if too long
      }

      console.log("[fetchCurriculumInfoTool] Successfully fetched and summarized curriculum info. Summary length:", summarizedText.length);
      return {
        summary: summarizedText,
        sourceHints: sourceHints,
      };

    } catch (error: any) {
      console.error(`[fetchCurriculumInfoTool] Error during curriculum search or summarization: ${error.message}`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.log(`SERVER LOG: Curriculum Search Failed - An error occurred: ${error.message}. Using general knowledge.`);
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
  prompt: `You are an AI assistant specializing in creating educational content for children, including those with learning difficulties. Your task is to generate a detailed and informative lesson AND a short quiz based on that lesson.

  The lesson MUST be tailored to the child's specific profile:
    Child Name: {{{childName}}}
    Child Age: {{{childAge}}}
    Target Language: {{{targetLanguage}}} (Generate ALL lesson content, titles, and quiz questions in this language. For example, if "es", generate in Spanish; if "fr", generate in French. If "en", generate in English.)
    Learning Difficulties: {{{learningDifficulties}}}
    Interests: {{{interests}}}
    Preferred Activities: {{{preferredActivities}}}
    Recent Mood: {{{recentMood}}} (This is an important instruction. You MUST adjust the tone AND consider the lesson format/activity types to be appropriately sensitive to the child's mood. For example, if the mood is 'sad' or 'anxious', the tone should be gentler, more patient, and reassuring. The lesson format might lean towards a calming story or simple interactive choices rather than a high-energy game. If the mood is 'happy' or 'excited', the tone can be more upbeat, and the lesson format could be more dynamic or game-like, if appropriate for the '{{{preferredActivities}}}' and topic. Always prioritize educational value.)
    Lesson History: {{{lessonHistory}}} (Avoid repetition if possible, build upon previous knowledge if relevant.)
    Curriculum Focus: {{{curriculum}}} (This is a CRITICAL guideline.)
    Lesson Topic: {{{lessonTopic}}} (The lesson MUST comprehensively teach this specific topic, and the quiz MUST test understanding of this topic.)
    Learning Style: {{{learningStyle}}}

  Content Personalization & Differentiation Guidelines:
  1.  Curriculum Research: FIRST, use the 'fetchCurriculumInfoTool' with the child's '{{{curriculum}}}', the '{{{lessonTopic}}}', '{{{childAge}}}', and '{{{targetLanguage}}}' to gather specific details about key concepts, learning objectives, common misconceptions, and expected depth from relevant educational sources.
  2.  Synthesis: THEN, generate the lesson by synthesizing the information retrieved by the 'fetchCurriculumInfoTool' WITH the child's full profile details (interests, learning difficulties, mood, etc.).
  3.  Language: ALL output text (lessonTitle, lessonContent, lessonFormat, subject, and all parts of the quiz including questionText, options, and explanation) MUST be in the 'Target Language': {{{targetLanguage}}}.
  4.  Complexity & Depth: Based on the information from 'fetchCurriculumInfoTool' and the Child's Age, determine the appropriate depth and complexity of the content, in the '{{{targetLanguage}}}'.
      - For younger children or those with significant learning difficulties specified in '{{{learningDifficulties}}}', use the tool's output to simplify concepts, use shorter sentences, provide more concrete examples, and break down information into smaller, more digestible chunks.
      - For older children or those in advanced curricula, use the tool's output to introduce more nuanced concepts and expect a higher level of understanding.
  5.  Interest Integration: Actively integrate the child's Interests ({{{interests}}}) into the lesson's examples, analogies, and narrative, using the curriculum context from the tool. Make the content relatable and exciting by connecting it to what the child enjoys. For example, if the topic is 'fractions', interests include 'space', and the tool indicates the curriculum expects focus on visual representation, use examples like 'dividing a spaceship's fuel visually' or 'sharing moon rocks', presented in '{{{targetLanguage}}}'.
  6.  Learning Style, Mood & Activity Adaptation:
      - Combine the specified Learning Style ({{{learningStyle}}}), Preferred Activities ({{{preferredActivities}}}), and Recent Mood ({{{recentMood}}}) to shape the lesson, informed by the curriculum details from the tool.
      - Visual learners with a preference for 'drawing', and a 'neutral' or 'happy' mood: Emphasize visual descriptions in the lesson content (guided by tool's findings on how curriculum approaches topic), and make the text evocative of scenes they could draw.
      - Auditory learners who like 'storytelling', and an 'anxious' mood: Structure the lesson as a gentle, engaging story (aligned with curriculum facts from tool), use calming dialogue, or pose simple questions for them to think about aloud.
      - Kinesthetic learners who prefer 'experiments' or 'building', and an 'excited' mood: If the topic and curriculum context (from tool) allow, frame explanations around actions or describe things in a way that relates to physical interaction.
      - Reading/Writing learners: Focus on clear, well-structured text. The quiz itself caters well to this. If mood is 'sad', ensure text is broken into smaller, less overwhelming chunks.
  7.  Lesson Format: The 'lessonFormat' field in your output should reflect the dominant style and activity preferences, influenced by mood if suitable (e.g., "Calming Story with Drawing Prompts" for a sad mood, "Exciting Space Adventure Quiz" for a happy mood with interest in space). If a standard informational approach is best based on curriculum, use "Informational ({{{curriculum}}} Aligned)". This description should also be in '{{{targetLanguage}}}'.

  KINESTHETIC LEARNING ENHANCEMENT:
  If the learning style is 'kinesthetic' OR if the child's preferred activities include kinesthetic elements (like 'building', 'experiments', 'movement', 'hands-on', 'dancing', 'sports', 'crafts', 'cooking', 'gardening', 'role-play', 'drama', 'construction', 'manipulatives', 'games', 'physical activities'), you MUST include a "kinestheticActivities" array with 5-8 specific, actionable activities that the child can do to reinforce the lesson content. These activities should be:
  - Age-appropriate and safe for the child's age ({{{childAge}}})
  - Related directly to the lesson topic ({{{lessonTopic}}})
  - Include movement, touch, manipulation, or physical interaction
  - Use common household materials when possible
  - Provide clear step-by-step instructions
  - Be educational and reinforce the curriculum concepts
  - Consider the child's interests ({{{interests}}}) and mood ({{{recentMood}}})
  - Be written in the target language ({{{targetLanguage}}})

  Examples of kinesthetic activities include:
  - Role-playing scenarios related to the topic
  - Building models with blocks, clay, or craft materials
  - Movement games that demonstrate concepts
  - Hands-on experiments with safe materials
  - Dance or movement sequences that represent concepts
  - Physical sorting or matching activities
  - Cooking or food preparation activities
  - Gardening or nature exploration
  - Sports or physical games that incorporate learning
  - Craft projects that demonstrate concepts
  - Interactive games with physical components
  - Manipulative-based learning activities

  Your output must be a JSON object with the following fields: "lessonTitle", "lessonContent" (an array of concise sentences), "lessonFormat", "subject", "quiz", AND "kinestheticActivities" (if the child is a kinesthetic learner or prefers kinesthetic activities). All text values must be in '{{{targetLanguage}}}'.
  The "quiz" field must be an array of 3-5 multiple-choice question objects. Each question object should have:
    - "questionText": string (The question itself, in '{{{targetLanguage}}}')
    - "options": string[] (An array of 2 to 4 answer choices, in '{{{targetLanguage}}}')
    - "correctAnswerIndex": number (The 0-based index of the correct answer within the "options" array)
    - "explanation": string (MANDATORY: A brief, child-friendly explanation in '{{{targetLanguage}}}' for why the correct answer is right and, if applicable, why common distractors might be incorrect. This explanation will be shown to the child if they answer incorrectly.)

  IMPORTANT:
  1.  Educational Depth & Curriculum Alignment:
      - After using the 'fetchCurriculumInfoTool', ensure the lesson is sufficiently informative and educational for a child of {{{childAge}}} following the {{{curriculum}}} for the specified {{{lessonTopic}}}, delivered in '{{{targetLanguage}}}'.
      - The content, depth, terminology, examples, and quiz questions you generate MUST closely mirror what would be found in official resources for a child of {{{childAge}}} learning about '{{{lessonTopic}}}' within the specified '{{{curriculum}}}', based on the information retrieved by the tool.
      - For instance, if '{{{curriculum}}}' is "CBSE Grade 5 Science", '{{{lessonTopic}}}' is "Photosynthesis," '{{{targetLanguage}}}' is "en", and the tool provides relevant CBSE concepts for Grade 5 Photosynthesis, the lesson must incorporate these. Quiz questions should be similar in style and difficulty to what a student might encounter in CBSE assessments for that grade and topic, using the tool's guidance.
      - The lesson should not be overly simplistic and must cover the topic comprehensively according to the specified curriculum's standards as informed by the 'fetchCurriculumInfoTool'.
  2.  Lesson Content: 'lessonContent' MUST be a JSON array of strings. Each string should be a single, complete, and concise sentence in '{{{targetLanguage}}}'. These sentences will be paired with images.
  3.  Sentence Count: Generate a substantial lesson with AT LEAST 25-35 sentences to ensure comprehensive coverage of the {{{lessonTopic}}}. For a 10-year-old on a CBSE curriculum, this count is critical for adequate depth. Ensure these sentences are distinct and cover different aspects of the topic rather than being repetitive.
  4.  Quiz Quality:
      - Generate 3-5 unique multiple-choice questions.
      - Each question must have between 2 and 4 plausible answer options.
      - Ensure one option is clearly correct based on the lesson content (informed by the tool and curriculum).
      - Questions should directly assess understanding of the material taught in 'lessonContent' and be aligned with the specified '{{{curriculum}}}' standards (using guidance from the tool).
      - Vary question difficulty appropriately for the child's age and curriculum.
      - EACH quiz question MUST have an "explanation" field, as described above, in '{{{targetLanguage}}}'.
  5.  Relevance: All content (lesson and quiz) MUST directly relate to teaching the 'Lesson Topic': {{{lessonTopic}}} in a manner consistent with the specified 'Curriculum Focus' ({{{curriculum}}}'), 'Child Age' ({{{childAge}}}), 'Learning Style' ({{{learningStyle}}}), 'Recent Mood' ({{{recentMood}}}), and 'Preferred Activities' ({{{preferredActivities}}}), all presented in '{{{targetLanguage}}}' and grounded by the 'fetchCurriculumInfoTool' output.
  6.  Tone: Maintain an encouraging, positive, and child-friendly tone throughout the lesson and quiz, further modulated by the 'Recent Mood' instruction, and expressed in '{{{targetLanguage}}}'.

  Example (If lesson topic is "The Water Cycle", age is 10, curriculum is "CBSE Grade 5 Environmental Science", mood is "neutral", learningStyle is "kinesthetic", preferredActivities is "Building, Experiments, Movement", targetLanguage is "en". Assume fetchCurriculumInfoTool provides key CBSE Grade 5 concepts for Water Cycle):
  {
    "lessonTitle": "The Amazing Journey of Water: Hands-On Adventure (CBSE Grade 5)",
    "lessonContent": [
      "Water is one of the most precious resources on our planet, essential for all forms of life. Imagine it sparkling blue in a vast ocean!",
      "As per your CBSE Grade 5 science syllabus, water exists in three main states: solid (like ice), liquid (like river water), and gas (like invisible water vapor).",
      // ... More sentences covering evaporation, condensation, precipitation, etc., aligned with tool's info on CBSE Grade 5 depth ...
      "The continuous movement of water on, above, and below the surface of the Earth is called the water cycle, or hydrological cycle. This is a key topic in your curriculum!",
      // ... (25-35 sentences total, ensuring curriculum points from the tool are covered) ...
      "Understanding the water cycle helps us appreciate the interconnectedness of Earth's systems and the critical importance of water conservation, as emphasized in the CBSE curriculum. It's like a beautiful, never-ending story of water's incredible journey all around us."
    ],
    "lessonFormat": "Interactive Hands-On Adventure (CBSE Aligned, Movement & Building Focused)",
    "subject": "Environmental Science (CBSE Grade 5)",
    "kinestheticActivities": [
      "Water Cycle Dance: Create a dance where you move like water - flow like a river, float like a cloud, fall like rain, and freeze like ice. Each movement represents a different stage of the water cycle.",
      "Mini Water Cycle in a Jar: Fill a clear jar with warm water, cover with plastic wrap, and place ice cubes on top. Watch as condensation forms and drips back down, creating a mini water cycle.",
      "Water Cycle Obstacle Course: Set up stations around your room - 'Ocean' (blue blanket), 'Cloud' (cotton balls), 'Mountain' (pillows), and 'River' (blue paper). Move between stations acting out the water cycle journey.",
      "Building a Water Cycle Model: Use cardboard, cotton balls, blue paper, and clear plastic to build a 3D model showing evaporation, condensation, precipitation, and collection.",
      "Water Movement Game: Use a spray bottle to simulate rain, a fan to show wind moving clouds, and your hands to demonstrate water flowing downhill.",
      "Role-Play Water Molecules: Each person becomes a water molecule, moving through different states and environments, changing how they move based on temperature and location.",
      "Water Conservation Relay: Set up stations with different water-saving activities - turn off taps, collect rainwater, and demonstrate water reuse.",
      "Weather Station Building: Create simple weather instruments using household materials to measure and track water cycle elements like humidity and precipitation."
    ],
    "quiz": [
      {
        "questionText": "According to your CBSE science understanding, what are the three main states of water, which you can often see around you?",
        "options": ["Solid, Liquid, Air", "Ice, Rain, Cloud", "Solid, Liquid, Gas", "Vapor, Mist, Dew"],
        "correctAnswerIndex": 2,
        "explanation": "Water exists as a solid (like ice you can see and touch), a liquid (like the water we drink or see in rivers), and a gas (like water vapor, which is invisible steam but leads to visible clouds). These are the three fundamental states of matter water takes on Earth, as covered in your science books."
      },
      // ... More quiz questions aligned with tool's output for CBSE Grade 5 ...
      {
        "questionText": "Which human activity, often discussed in CBSE Environmental Science, can negatively impact the water cycle by reducing trees that release water vapor?",
        "options": ["Planting trees (afforestation)", "Conserving water", "Deforestation (cutting down trees)", "Building rainwater harvesting systems"],
        "correctAnswerIndex": 2,
        "explanation": "Deforestation, which is cutting down large numbers of trees, can harm the water cycle. Trees help release water vapor (transpiration) and their roots help water soak into the ground. Without them, there can be less rain and more runoff, disrupting the natural balance and the look of our landscapes."
      }
    ]
  }

  Please respond ONLY in JSON format matching this structure. Ensure all quiz questions have an explanation and all content is appropriate for the specified age, curriculum (as informed by the 'fetchCurriculumInfoTool'), mood, learning style, and preferred activities, and is in the '{{{targetLanguage}}}'.
  `,
});


const generateTailoredLessonsFlow = ai.defineFlow(
  {
    name: 'generateTailoredLessonsFlow',
    inputSchema: GenerateTailoredLessonsInputSchema,
    outputSchema: GenerateTailoredLessonsOutputSchema,
  },
  async (input) => {
    console.log('[generateTailoredLessonsFlow] Starting internal flow with input:', JSON.stringify(input, null, 2));
    try {
      let textAndQuizOutput;
      
      try {
        console.log('[generateTailoredLessonsFlow] Calling generateLessonPrompt with input:', JSON.stringify(input, null, 2));
        const result = await generateLessonPrompt(input);
        console.log('[generateTailoredLessonsFlow] Raw result from generateLessonPrompt:', JSON.stringify(result, null, 2));

        textAndQuizOutput = result.output;
        console.log('[generateTailoredLessonsFlow] Parsed output from generateLessonPrompt (textAndQuizOutput):', JSON.stringify(textAndQuizOutput, null, 2));

        if (!textAndQuizOutput) {
            console.error('[generateTailoredLessonsFlow] CRITICAL: Output from generateLessonPrompt was null or undefined. This indicates a problem with the prompt execution or the AI model response. Input:', JSON.stringify(input, null, 2), 'Raw result from prompt:', JSON.stringify(result, null, 2));
            throw new Error("Failed to generate lesson text and quiz. AI model returned no output from the main prompt.");
        }
        console.log('[generateTailoredLessonsFlow] Received output from generateLessonPrompt. Title:', textAndQuizOutput.lessonTitle, 'Content sentence count:', textAndQuizOutput.lessonContent?.length, 'Quiz question count:', textAndQuizOutput.quiz?.length);

      } catch (promptError: any) {
        let errorDetails = `Message: ${promptError.message || 'No message'}, Name: ${promptError.name || 'No name'}`;
        if (promptError.stack) { errorDetails += `, Stack: ${promptError.stack}`; }
        try { errorDetails += `, FullErrorObject: ${JSON.stringify(promptError, Object.getOwnPropertyNames(promptError))}`; } 
        catch (e) { errorDetails += `, FullErrorObject: (Unstringifiable)`; }
        console.error(`[generateTailoredLessonsFlow] Error directly from generateLessonPrompt execution for topic "${input.lessonTopic}", child age ${input.childAge}: ${errorDetails}`);
        
        if (promptError.message && (promptError.message.includes('fetchCurriculumInfoTool') || promptError.message.includes('tool'))) {
            throw new Error(`Error during curriculum information fetching for topic "${input.lessonTopic}": ${promptError.message}. Please check tool logs and API configurations.`);
        }
        throw new Error(`AI prompt for lesson "${input.lessonTopic}" failed: ${promptError.message || 'Unknown prompt error'}`);
      }
      
      let lessonContent = textAndQuizOutput.lessonContent;
      if (typeof lessonContent === 'string') {
          console.warn('[generateTailoredLessonsFlow] Lesson content was a string, attempting to parse or split. Received string:', lessonContent);
          const contentString = lessonContent as string;
          try {
            const parsed = JSON.parse(contentString);
            if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
              lessonContent = parsed;
              console.log('[generateTailoredLessonsFlow] Successfully parsed string content into array.');
            } else {
              console.warn('[generateTailoredLessonsFlow] Parsed string content was not an array of strings. Splitting by sentence.');
              lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
            }
          } catch (e) {
            console.warn('[generateTailoredLessonsFlow] Failed to parse string content as JSON. Splitting by sentence. Error:', e);
            lessonContent = contentString.match(/[^.!?]+[.!?]+/g) || [contentString];
          }
          console.log('[generateTailoredLessonsFlow] Processed string content. New sentence count:', lessonContent.length);
      } else if (!Array.isArray(lessonContent) || !lessonContent.every(item => typeof item === 'string')) {
          console.warn("[generateTailoredLessonsFlow] Lesson content was not a valid array of strings, attempting to coerce. Received (type " + typeof lessonContent + "):", JSON.stringify(lessonContent));
          if (lessonContent && typeof (lessonContent as any).toString === 'function') {
            const singleSentence = (lessonContent as any).toString();
            lessonContent = singleSentence.match(/[^.!?]+[.!?]+/g) || [singleSentence];
          } else {
            lessonContent = ["Default lesson content as the received format was unusable."];
          }
          console.log('[generateTailoredLessonsFlow] Coerced invalid content into sentence count:', lessonContent.length);
      }
      
      if (lessonContent.length === 0) {
          console.warn("[generateTailoredLessonsFlow] Lesson content array was empty after processing. Using fallback.");
          lessonContent = ["Let's start our lesson! This is a default sentence because content generation was empty."]; 
      }
      
      const imageGenerationPromises: Promise<{ sentences: string[]; imageDataUri: string | null }>[] = [];
      console.log(`[generateTailoredLessonsFlow] Starting image generation for ${Math.ceil(lessonContent.length / 2)} pairs of sentences for lesson "${textAndQuizOutput.lessonTitle}".`);

      for (let i = 0; i < lessonContent.length; i += 2) {
        const rawSentences = await Promise.all(lessonContent.slice(i, i + 2).map(async s => await cleanSentence(s)));
        const pageSentences = rawSentences.filter(s => s.length > 0);
        
        if (pageSentences.length > 0) {
            console.log(`[generateTailoredLessonsFlow] Preparing to generate image for sentences: "${pageSentences.join(' ')}"`);
            imageGenerationPromises.push(
            (async () => {
                let imageDataUri: string | null = null;
                try {
                const imageInput: GenerateImageInput = {
                    sentences: pageSentences,
                    childAge: input.childAge,
                    interests: input.interests,
                };
                console.log(`[generateTailoredLessonsFlow] Calling generateImageForSentence with input:`, JSON.stringify(imageInput));
                const imageResult = await generateImageForSentence(imageInput);
                imageDataUri = imageResult.imageDataUri;
                console.log(`[generateTailoredLessonsFlow] Image generated successfully for: "${pageSentences.join(' ')}" (URI length: ${imageDataUri?.length})`);
                } catch (imgErr: any) {
                console.error(`[generateTailoredLessonsFlow] Failed to generate image for sentences: "${pageSentences.join(' ')}" for lesson "${textAndQuizOutput.lessonTitle}"`, imgErr.message ? imgErr.message : JSON.stringify(imgErr));
                // imageDataUri remains null, allowing the lesson to proceed without this image.
                }
                return { sentences: pageSentences, imageDataUri };
            })()
            );
        }
      }

      const resolvedLessonPages = await Promise.all(imageGenerationPromises);
      console.log('[generateTailoredLessonsFlow] All image generation promises resolved. Page count:', resolvedLessonPages.length);

      let quiz = textAndQuizOutput.quiz;
      if (!Array.isArray(quiz) || !quiz.every(q => q && typeof q.questionText === 'string' && Array.isArray(q.options) && typeof q.correctAnswerIndex === 'number' && typeof q.explanation === 'string')) {
        console.warn(`[generateTailoredLessonsFlow] Generated quiz data for lesson "${textAndQuizOutput.lessonTitle}" is not in the expected format or is missing explanations. Using an empty quiz. Received:`, JSON.stringify(quiz));
        quiz = []; 
      } else {
        console.log('[generateTailoredLessonsFlow] Quiz data seems valid. Question count:', quiz.length);
      }

      const finalOutput = {
        lessonTitle: textAndQuizOutput.lessonTitle || `Lesson on ${input.lessonTopic}`,
        lessonFormat: textAndQuizOutput.lessonFormat || "Informational",
        subject: textAndQuizOutput.subject || "General Knowledge",
        lessonPages: resolvedLessonPages.filter(page => page.sentences.length > 0),
        quiz: quiz,
        kinestheticActivities: textAndQuizOutput.kinestheticActivities || [],
      };
      console.log('[generateTailoredLessonsFlow] Successfully assembled final lesson output. Title:', finalOutput.lessonTitle, 'Pages:', finalOutput.lessonPages.length, 'Quiz items:', finalOutput.quiz.length, 'Output object keys:', Object.keys(finalOutput).join(', '));
      return finalOutput;

    } catch (flowError: any) {
      let errorDetails = `Message: ${flowError.message || 'No message'}, Name: ${flowError.name || 'No name'}`;
      if (flowError.stack) { errorDetails += `, Stack: ${flowError.stack}`; }
      try { errorDetails += `, FullErrorObject: ${JSON.stringify(flowError, Object.getOwnPropertyNames(flowError))}`; } 
      catch (e) { errorDetails += `, FullErrorObject: (Unstringifiable)`; }
      console.error(`[generateTailoredLessonsFlow] CRITICAL error during main lesson generation flow for topic "${input.lessonTopic}", child age ${input.childAge}: ${errorDetails}`);
      
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
  console.log('[generateTailoredLessons wrapper] Called with input:', JSON.stringify(input, null, 2));
  try {
    const result = await generateTailoredLessonsFlow(input);
    console.log('[generateTailoredLessons wrapper] Successfully generated lesson. Title:', result.lessonTitle);
    return result;
  } catch (error: any) {
    let errorDetails = `Message: ${error.message || 'No message'}, Name: ${error.name || 'No name'}`;
    if (error.stack) { errorDetails += `, Stack: ${error.stack}`; }
    try { errorDetails += `, FullErrorObject: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`; } 
    catch (e) { errorDetails += `, FullErrorObject: (Unstringifiable)`; }
    console.error(`[generateTailoredLessons wrapper] Error during lesson generation flow for topic "${input.lessonTopic}", child age ${input.childAge}: ${errorDetails}`);

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
    
