# LearnForward

This is a NextJS application for LearnForward, a learning app for children with learning difficulties.

## Getting Started

To get started, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

2.  **Set up Firebase Environment Variables:**
    Create a `.env.local` file in the root of your project (or update the existing `.env` file). Add your Firebase project's configuration details to this file. You can find these details in your Firebase project settings.

    Example `.env.local` or `.env` file content:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    # NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID" # Optional
    ```
    **Important:** Replace `"YOUR_API_KEY"`, `"YOUR_AUTH_DOMAIN"`, etc., with your actual Firebase project credentials.

3.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    This will start the Next.js development server, typically on `http://localhost:9002`.

4.  **Run Genkit (for AI features):**
    In a separate terminal, start the Genkit development server:
    ```bash
    npm run genkit:dev
    # or for watching changes
    npm run genkit:watch
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the application.

The main application code can be found in `src/app/`.

## Core Features:

- Parent Sign-In: Parents sign in using Firebase Authentication with email/password.
- Child Reference Update: (Future Feature - Cloud Function triggers when a child profile is created to update the parent's profile with the new child's reference).
- AI-Powered Lesson Generation: Generates a lesson using Gemini API based on structured JSON prompt incorporating child profile, recent mood, and lesson history.
- Adaptive Lesson Display: Displays lessons in a format optimized for children, taking into account potential screen issues or preferred themes from their profiles.
- Profile Persistence: Uses localStorage to store all the children profiles locally.
