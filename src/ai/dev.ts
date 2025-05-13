
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-child-insights.ts';
import '@/ai/flows/generate-lesson.ts';
import '@/ai/flows/generate-image-for-sentence.ts';
import '@/ai/flows/suggest-lesson-topic.ts';
import '@/ai/flows/recommend-next-lesson.ts'; // Added new flow
