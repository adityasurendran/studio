# **App Name**: LearnForward

## Core Features:

- Parent Sign-In: Parents sign in using Firebase Authentication with email/password.
- Child Reference Update: Cloud Function triggers when a child profile is created to update the parent's profile with the new child's reference.
- AI-Powered Lesson Generation: Generates a lesson using Gemini API based on structured JSON prompt incorporating child profile, recent mood, and lesson history.
- Adaptive Lesson Display: Displays lessons in a format optimized for children, taking into account potential screen issues or preferred themes from their profiles.
- Profile Persistence: Uses localStorage to store all the children profiles locally

## Style Guidelines:

- Primary color: Soft teal (#A0E7E5) for a calming and engaging learning environment.
- Secondary color: Pale yellow (#FAF3DD) to provide contrast without being jarring.
- Accent: Coral (#FFB347) to draw attention to important interactive elements like CTAs.
- Clear, simple sans-serif typography optimized for young readers.
- Friendly, cartoon-style icons to represent different lesson topics and achievement types.
- Gentle, positive animations (e.g., a small burst of stars) to reward correct answers and achievements.