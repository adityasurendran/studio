import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check for GOOGLE_API_KEY
if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === "YOUR_GOOGLE_AI_API_KEY") {
  const message = !process.env.GOOGLE_API_KEY
    ? "LearnForward Genkit Setup: GOOGLE_API_KEY is not set in your environment variables. "
    : "LearnForward Genkit Setup: GOOGLE_API_KEY appears to be the placeholder 'YOUR_GOOGLE_AI_API_KEY'. ";
  
  console.warn(
    message +
    "Genkit's Google AI plugin may not function correctly. This key is required for Gemini models. " +
    "Please add it to your .env file (e.g., GOOGLE_API_KEY=\"your_actual_google_ai_api_key\"). " +
    "This key is different from your Firebase API key."
  );
}


export const ai = genkit({
  plugins: [googleAI()], // This will use GOOGLE_API_KEY from environment variables
  model: 'googleai/gemini-2.0-flash', // Default model for text generation
});
