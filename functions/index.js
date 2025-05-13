const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Ensure Stripe secret key is sourced correctly for deployed functions vs local dev
const stripeSecretKey = functions.config().stripe && functions.config().stripe.secret_key
                        ? functions.config().stripe.secret_key
                        : process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error("Stripe Secret Key is not configured. Set STRIPE_SECRET_KEY in .env or Firebase config 'stripe.secret_key'.");
}
const stripe = require("stripe")(stripeSecretKey);

// Ensure Stripe webhook secret is sourced correctly
const stripeWebhookSecret = functions.config().stripe && functions.config().stripe.webhook_secret
                            ? functions.config().stripe.webhook_secret
                            : process.env.STRIPE_WEBHOOK_SECRET;
if (!stripeWebhookSecret && process.env.NODE_ENV === 'production') { // Webhook secret is critical in production
    console.warn("Stripe Webhook Secret is not configured. This is required for deployed environments.");
}

// Ensure App Base URL is sourced correctly
const appBaseUrl = functions.config().app && functions.config().app.base_url
                   ? functions.config().app.base_url
                   : process.env.APP_BASE_URL || "http://localhost:9002";

console.log("Firebase Functions initialized.");
console.log(`App Base URL configured as: ${appBaseUrl}`);


// Helper function to get or create a Stripe customer for a Firebase user
const getOrCreateStripeCustomer = async (userId, email) => {
  const userRef = admin.firestore().collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (userDoc.exists && userDoc.data().stripeCustomerId) {
    console.log(`Found existing Stripe Customer ID for UID ${userId}: ${userDoc.data().stripeCustomerId}`);
    return userDoc.data().stripeCustomerId;
  }

  console.log(`No existing Stripe Customer ID for UID ${userId}. Creating new customer for email: ${email}`);
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      firebaseUID: userId,
    },
  });

  await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
  console.log(`Created and stored new Stripe Customer ID for UID ${userId}: ${customer.id}`);
  return customer.id;
};

exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to subscribe.");
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email || "";
  // Ensure priceId is sourced correctly
  const priceId = functions.config().stripe && functions.config().stripe.price_id
                  ? functions.config().stripe.price_id
                  : process.env.STRIPE_PRICE_ID;

  if (!priceId) {
      console.error("Stripe Price ID is not configured. Set STRIPE_PRICE_ID in .env for local development or 'stripe.price_id' in Firebase functions config for deployment.");
      throw new functions.https.HttpsError("internal", "Subscription configuration error: Stripe Price ID is missing. Please contact support.");
  }
  console.log(`Attempting to create Stripe Checkout session for UID: ${userId}, Email: ${userEmail}, with Price ID: ${priceId}`);

  try {
    const stripeCustomerId = await getOrCreateStripeCustomer(userId, userEmail);
    // console.log(`Using Stripe Customer ID for UID ${userId}: ${stripeCustomerId}`); // Already logged in getOrCreate

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appBaseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/subscribe?canceled=true`,
      metadata: {
        firebaseUID: userId, 
      }
    });

    console.log(`Stripe Checkout Session created successfully for UID ${userId}. Session ID: ${session.id}, URL: ${session.url ? 'Provided' : 'Not Provided'}`);
    if (!session.url) {
        console.warn(`Stripe session created for UID ${userId} but no URL was returned. Session object:`, session);
    }
    return { sessionId: session.id, sessionUrl: session.url };
  } catch (error) {
    console.error(`Error creating Stripe checkout session for UID ${userId}. Error:`, error);
    let errorMessage = error.message || "An unknown error occurred.";
    if (error.raw && error.raw.message) {
        console.error("Stripe raw error message:", error.raw.message);
        errorMessage = `Stripe Error: ${error.raw.message}`;
    } else if (error.type) {
        console.error("Stripe error type:", error.type);
        errorMessage = `Stripe Error Type: ${error.type}. Message: ${errorMessage}`;
    }
    throw new functions.https.HttpsError("internal", `Failed to create subscription session. ${errorMessage}`);
  }
});

exports.stripeWebhookHandler = functions.https.onRequest(async (req, res) => {
  if (!stripeWebhookSecret) {
    console.error("Stripe Webhook Secret is not configured. Cannot process webhook.");
    return res.status(500).send("Webhook Error: Missing webhook secret configuration on server.");
  }
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("Received Stripe webhook event:", event.type, "ID:", event.id);
  const userRef = admin.firestore().collection("users");

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const firebaseUID = session.metadata.firebaseUID || session.client_reference_id; 
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (!firebaseUID) {
            console.error("Error: checkout.session.completed event missing firebaseUID in metadata or client_reference_id. Session:", session);
            // Attempt to find by customer ID if UID is missing
            if (stripeCustomerId) {
                const userQueryByCustomerId = await userRef.where("stripeCustomerId", "==", stripeCustomerId).limit(1).get();
                if (!userQueryByCustomerId.empty) {
                    const foundUserId = userQueryByCustomerId.docs[0].id;
                    console.warn(`firebaseUID missing in session metadata, but found user ${foundUserId} by stripeCustomerId ${stripeCustomerId}. Proceeding with this user.`);
                    await userRef.doc(foundUserId).update({
                        isSubscribed: true,
                        stripeSubscriptionId: stripeSubscriptionId,
                        stripeSubscriptionStatus: "active", 
                    });
                     // Ensure stripeCustomerId is also stored if it wasn't (though it should be from getOrCreate)
                    if (!userQueryByCustomerId.docs[0].data().stripeCustomerId) {
                         await userRef.doc(foundUserId).update({ stripeCustomerId: stripeCustomerId });
                    }
                } else {
                     console.error(`Critical Error: firebaseUID missing AND no user found with Stripe Customer ID: ${stripeCustomerId}. Cannot update subscription status.`);
                     return res.status(400).send("Webhook Error: Missing firebaseUID and cannot map customer ID.");
                }
            } else {
                 return res.status(400).send("Webhook Error: Missing firebaseUID in session metadata and no customer ID to attempt mapping.");
            }
        } else {
            console.log(`Checkout session completed for UID: ${firebaseUID}, Sub ID: ${stripeSubscriptionId}, Customer ID: ${stripeCustomerId}`);
            await userRef.doc(firebaseUID).update({
                isSubscribed: true,
                stripeSubscriptionId: stripeSubscriptionId,
                stripeCustomerId: stripeCustomerId, 
                stripeSubscriptionStatus: "active", 
            });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;
        const userQuery = await userRef.where("stripeCustomerId", "==", stripeCustomerId).limit(1).get();
        if (!userQuery.empty) {
          const userId = userQuery.docs[0].id;
          const newStatus = subscription.status;
          const isNowSubscribed = newStatus === "active" || newStatus === "trialing";
          console.log(`Subscription updated for UID: ${userId}. New Status: ${newStatus}, Is Subscribed: ${isNowSubscribed}`);
          await userRef.doc(userId).update({
            isSubscribed: isNowSubscribed,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: newStatus,
          });
        } else {
            console.warn(`No user found with Stripe Customer ID: ${stripeCustomerId} for subscription update (event ID: ${event.id}).`);
        }
        break;
      }
      case "customer.subscription.deleted": { 
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;
        const userQuery = await userRef.where("stripeCustomerId", "==", stripeCustomerId).limit(1).get();
        if (!userQuery.empty) {
          const userId = userQuery.docs[0].id;
          console.log(`Subscription deleted (canceled) for UID: ${userId}. Status: ${subscription.status}`);
          await userRef.doc(userId).update({
            isSubscribed: false,
            stripeSubscriptionStatus: subscription.status, // Typically 'canceled'
          });
        } else {
            console.warn(`No user found with Stripe Customer ID: ${stripeCustomerId} for subscription deletion (event ID: ${event.id}).`);
        }
        break;
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type} (ID: ${event.id})`);
    }
    res.json({ received: true });
  } catch (error) {
      console.error("Error handling Stripe webhook event:", event.type, "ID:", event.id, "Error:", error);
      res.status(500).json({ error: `Webhook handler failed. ${error.message}` });
  }
});
