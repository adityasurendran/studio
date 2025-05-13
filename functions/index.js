const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const stripe = require("stripe")(functions.config().stripe ? functions.config().stripe.secret_key : process.env.STRIPE_SECRET_KEY);
const stripeWebhookSecret = functions.config().stripe ? functions.config().stripe.webhook_secret : process.env.STRIPE_WEBHOOK_SECRET;
const appBaseUrl = functions.config().app ? functions.config().app.base_url : process.env.APP_BASE_URL || "http://localhost:9002";


// Helper function to get or create a Stripe customer for a Firebase user
const getOrCreateStripeCustomer = async (userId, email) => {
  const userRef = admin.firestore().collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (userDoc.exists && userDoc.data().stripeCustomerId) {
    return userDoc.data().stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      firebaseUID: userId,
    },
  });

  await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
  return customer.id;
};

exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to subscribe.");
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email || "";
  const priceId = functions.config().stripe ? functions.config().stripe.price_id : process.env.STRIPE_PRICE_ID;

  if (!priceId) {
      console.error("Stripe Price ID is not configured. Set STRIPE_PRICE_ID in .env or Firebase config.");
      throw new functions.https.HttpsError("internal", "Subscription configuration error. Please contact support.");
  }

  try {
    const stripeCustomerId = await getOrCreateStripeCustomer(userId, userEmail);

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
        firebaseUID: userId, // Important for webhook handling
      }
    });

    return { sessionId: session.id, sessionUrl: session.url };
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    throw new functions.https.HttpsError("internal", "Failed to create subscription session. " + error.message);
  }
});

exports.stripeWebhookHandler = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const userRef = admin.firestore().collection("users");

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const firebaseUID = session.metadata.firebaseUID || session.client_reference_id; // Use metadata first
        const stripeCustomerId = session.customer;
        const stripeSubscriptionId = session.subscription;

        if (!firebaseUID) {
            console.error("Error: checkout.session.completed event missing firebaseUID in metadata.");
            return res.status(400).send("Webhook Error: Missing firebaseUID in session metadata.");
        }
        
        console.log(`Checkout session completed for UID: ${firebaseUID}, Sub ID: ${stripeSubscriptionId}`);
        await userRef.doc(firebaseUID).update({
          isSubscribed: true,
          stripeSubscriptionId: stripeSubscriptionId,
          stripeCustomerId: stripeCustomerId, // ensure customerId is also stored/updated
          stripeSubscriptionStatus: "active", // Assuming active on completion
        });
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;
        const userQuery = await userRef.where("stripeCustomerId", "==", stripeCustomerId).limit(1).get();
        if (!userQuery.empty) {
          const userId = userQuery.docs[0].id;
          console.log(`Subscription updated for UID: ${userId}, Status: ${subscription.status}`);
          await userRef.doc(userId).update({
            isSubscribed: subscription.status === "active" || subscription.status === "trialing",
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionStatus: subscription.status,
          });
        } else {
            console.warn(`No user found with Stripe Customer ID: ${stripeCustomerId} for subscription update.`);
        }
        break;
      }
      case "customer.subscription.deleted": { // Handles cancellations
        const subscription = event.data.object;
         const stripeCustomerId = subscription.customer;
        const userQuery = await userRef.where("stripeCustomerId", "==", stripeCustomerId).limit(1).get();
        if (!userQuery.empty) {
          const userId = userQuery.docs[0].id;
          console.log(`Subscription deleted for UID: ${userId}`);
          await userRef.doc(userId).update({
            isSubscribed: false,
            stripeSubscriptionStatus: "canceled", // or subscription.status
          });
        } else {
            console.warn(`No user found with Stripe Customer ID: ${stripeCustomerId} for subscription deletion.`);
        }
        break;
      }
      // Add other event types as needed (e.g., invoice.payment_failed)
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
      console.error("Error handling webhook event:", error);
      res.status(500).json({ error: "Webhook handler failed. " + error.message });
  }
});