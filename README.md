md
# Shannon

This is a NextJS application for Shannon, a learning app for children with learning difficulties.

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
    If you have a `functions` directory for Firebase Cloud Functions, navigate into it and run `npm install` there as well:
    ```bash
    cd functions
    npm install
    cd ..
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

3.  **Set up Stripe Environment Variables & Configuration:**
    Shannon uses Stripe for managing subscriptions.
    *   Update your `.env` or `.env.local` file with your Stripe keys and Price ID:
        ```env
        # Stripe Configuration
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY" # Stripe Publishable Key
        STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"               # Stripe Secret Key
        STRIPE_PRICE_ID="YOUR_STRIPE_PRICE_ID"                   # Stripe Price ID for your subscription product (e.g., price_xxxxxxxxxxxxxx)
        STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET"       # Stripe Webhook Signing Secret
        APP_BASE_URL="http://localhost:9002"                     # Your app's base URL (update for production)
        ```
    *   **Configure Firebase Functions Environment:** For deployed functions, set these Stripe variables in the Firebase environment:
        ```bash
        firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY"
        firebase functions:config:set stripe.price_id="YOUR_STRIPE_PRICE_ID"
        firebase functions:config:set stripe.webhook_secret="YOUR_STRIPE_WEBHOOK_SECRET"
        firebase functions:config:set app.base_url="YOUR_PRODUCTION_APP_URL" # e.g., https://your-app.com
        ```
        Deploy functions after setting config: `firebase deploy --only functions`
    *   **Troubleshooting "Internal Error" on Subscription:** If you encounter an "internal error firebase" message when trying to subscribe, **check your Firebase Function logs** in the Firebase Console (Functions > Logs for the `createStripeCheckoutSession` function). These logs will provide specific error details from the backend, often related to missing or incorrect Stripe keys/Price ID or other configuration issues.

4.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    This will start the Next.js development server, typically on `http://localhost:9002`.

5.  **Run Genkit (for AI features):**
    In a separate terminal, start the Genkit development server:
    ```bash
    npm run genkit:dev
    # or for watching changes
    npm run genkit:watch
    ```

6.  **Run Firebase Emulators (Recommended for testing Cloud Functions locally):**
    In a separate terminal:
    ```bash
    firebase emulators:start --only functions,firestore # Add other services if needed
    ```
    To use Firebase emulators, ensure your application connects to them. For client-side Firebase SDK, you might need to add conditional logic (e.g., based on `process.env.NODE_ENV === 'development'`) in `src/lib/firebase.ts` to use `connectAuthEmulator`, `connectFirestoreEmulator`, `connectFunctionsEmulator`, etc.

7.  **Set up Stripe Webhook:**
    *   Deploy your `stripeWebhookHandler` Cloud Function. Get its URL (e.g., from Firebase console).
    *   In your Stripe Dashboard (Developers > Webhooks), add an endpoint.
    *   Paste the Cloud Function URL as the "Endpoint URL".
    *   Select events to listen for:
        *   `checkout.session.completed`
        *   `customer.subscription.updated`
        *   `customer.subscription.deleted`
        *   (Consider adding `invoice.payment_failed`, `invoice.payment_succeeded`)
    *   After creating the endpoint, Stripe will show a "Signing secret" (e.g., `whsec_xxxxxxxxxxxxxx`). Copy this and set it as `STRIPE_WEBHOOK_SECRET` in your `.env` file and Firebase functions config.
    *   **For local testing:** Use the Stripe CLI to forward webhooks to your local emulator:
        ```bash
        # Ensure your Firebase emulators are running. The default port for functions is 5001.
        # Replace 'your-project-id' and 'your-region' (e.g., us-central1)
        stripe listen --forward-to localhost:5001/your-project-id/your-region/stripeWebhookHandler 
        ```
        The Stripe CLI will provide a webhook signing secret (usually starts with `whsec_...`). **Use this specific secret for `STRIPE_WEBHOOK_SECRET` in your `.env` file when testing locally with the Stripe CLI.** Do NOT use your production webhook secret for local CLI forwarding.


Open [http://localhost:9002](http://localhost:9002) with your browser to see the application.

The main application code can be found in `src/app/`.
Firebase Cloud Functions are in the `functions/` directory.

## Core Features:

- Parent Sign-In: Parents sign in using Firebase Authentication with email/password.
- Subscription Management: Uses Stripe to handle subscriptions for accessing premium features.
- Child Profile Management: Parents create and manage profiles for their children.
- AI-Powered Lesson Generation: Generates lessons using Genkit and AI models, tailored to child profiles.
- Adaptive Lesson Display: Displays lessons with appropriate formatting and images.
- Progress Tracking: Lesson attempts and quiz scores are saved per child.
- Profile Persistence: Uses localStorage for child profiles (though user/subscription data is in Firestore).
```