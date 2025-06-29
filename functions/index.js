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

// Import email service
const { sendWeeklyProgressEmail, testEmailConfig } = require('./email-service');

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

// Weekly Progress Email Function (Scheduled)
exports.sendWeeklyProgressEmails = functions.pubsub.schedule('0 9 * * 1').timeZone('UTC').onRun(async (context) => {
  console.log('Starting weekly progress email job...');
  
  try {
    // Test email configuration first
    const emailConfigValid = await testEmailConfig();
    if (!emailConfigValid) {
      console.error('Email configuration is invalid. Skipping weekly progress emails.');
      return null;
    }

    const db = admin.firestore();
    const usersRef = db.collection('users');
    const childProfilesRef = db.collection('childProfiles');

    // Get all users with email addresses
    const usersSnapshot = await usersRef.where('email', '!=', null).get();
    
    if (usersSnapshot.empty) {
      console.log('No users with email addresses found.');
      return null;
    }

    let emailsSent = 0;
    let errors = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const parentEmail = userData.email;
      const userId = userDoc.id;

      try {
        // Get child profiles for this user
        const childProfilesSnapshot = await childProfilesRef
          .where('parentId', '==', userId)
          .get();

        if (childProfilesSnapshot.empty) {
          console.log(`No child profiles found for user ${userId}`);
          continue;
        }

        // Process each child profile
        for (const childDoc of childProfilesSnapshot.docs) {
          const childProfile = childDoc.data();
          
          // Get lesson attempts from the last 7 days
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const recentAttempts = (childProfile.lessonAttempts || [])
            .filter(attempt => new Date(attempt.timestamp) >= oneWeekAgo);

          // Only send email if there are recent attempts or if it's the first week
          if (recentAttempts.length > 0 || !childProfile.lastEmailSent) {
            await sendWeeklyProgressEmail(parentEmail, childProfile, recentAttempts);
            emailsSent++;
            
            // Update last email sent timestamp
            await childDoc.ref.update({
              lastEmailSent: new Date().toISOString()
            });
            
            console.log(`Weekly progress email sent for child ${childProfile.name} to ${parentEmail}`);
          } else {
            console.log(`No recent activity for child ${childProfile.name}, skipping email`);
          }
        }

      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        errors++;
      }
    }

    console.log(`Weekly progress email job completed. Emails sent: ${emailsSent}, Errors: ${errors}`);
    return { emailsSent, errors };

  } catch (error) {
    console.error('Error in weekly progress email job:', error);
    throw error;
  }
});

// Manual trigger function for testing weekly progress emails
exports.sendTestWeeklyProgressEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in to send test emails.");
  }

  const { childId } = data;
  if (!childId) {
    throw new functions.https.HttpsError("invalid-argument", "Child ID is required.");
  }

  try {
    const db = admin.firestore();
    const childDoc = await db.collection('childProfiles').doc(childId).get();
    
    if (!childDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Child profile not found.");
    }

    const childProfile = childDoc.data();
    const parentEmail = context.auth.token.email;

    // Get all lesson attempts for testing
    const allAttempts = childProfile.lessonAttempts || [];
    
    await sendWeeklyProgressEmail(parentEmail, childProfile, allAttempts);
    
    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    console.error('Error sending test weekly progress email:', error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// PIN Management Functions
const bcrypt = require('bcryptjs');

exports.setupPin = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { pin } = data;
  const userId = context.auth.uid;

  // Validate PIN
  if (!pin || typeof pin !== 'string' || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new functions.https.HttpsError('invalid-argument', 'PIN must be a 4-digit number');
  }

  try {
    // Hash the PIN with bcrypt
    const saltRounds = 12;
    const hashedPin = await bcrypt.hash(pin, saltRounds);

    // Store hashed PIN in Firestore
    await admin.firestore().collection('pins').doc(userId).set({
      hashedPin,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error setting up PIN:', error);
    throw new functions.https.HttpsError('internal', 'Failed to setup PIN');
  }
});

exports.verifyPin = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { pin } = data;
  const userId = context.auth.uid;

  // Validate PIN
  if (!pin || typeof pin !== 'string' || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new functions.https.HttpsError('invalid-argument', 'PIN must be a 4-digit number');
  }

  try {
    // Get hashed PIN from Firestore
    const pinDoc = await admin.firestore().collection('pins').doc(userId).get();
    
    if (!pinDoc.exists) {
      return false;
    }

    const { hashedPin } = pinDoc.data();
    
    // Compare PIN with hash
    const isValid = await bcrypt.compare(pin, hashedPin);
    return isValid;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    throw new functions.https.HttpsError('internal', 'Failed to verify PIN');
  }
});

exports.clearPin = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Delete PIN from Firestore
    await admin.firestore().collection('pins').doc(userId).delete();

    return { success: true };
  } catch (error) {
    console.error('Error clearing PIN:', error);
    throw new functions.https.HttpsError('internal', 'Failed to clear PIN');
  }
});

exports.requestPinReset = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  if (!userEmail) {
    throw new functions.https.HttpsError('failed-precondition', 'User email is required for PIN reset');
  }

  try {
    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in Firestore
    await admin.firestore().collection('pinResetTokens').doc(resetToken).set({
      userId,
      userEmail,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send reset email
    const resetUrl = `${appBaseUrl}/dashboard/parent-settings?resetToken=${resetToken}`;
    
    // You can use your email service here or a simple email
    console.log(`PIN reset requested for user ${userId}. Reset URL: ${resetUrl}`);
    
    // For now, we'll just return the reset URL (in production, send via email)
    return { 
      success: true, 
      message: 'PIN reset email sent',
      resetUrl // Remove this in production
    };
  } catch (error) {
    console.error('Error requesting PIN reset:', error);
    throw new functions.https.HttpsError('internal', 'Failed to request PIN reset');
  }
});

exports.resetPin = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { resetToken, newPin } = data;
  const userId = context.auth.uid;

  // Validate new PIN
  if (!newPin || typeof newPin !== 'string' || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    throw new functions.https.HttpsError('invalid-argument', 'New PIN must be a 4-digit number');
  }

  if (!resetToken || typeof resetToken !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Reset token is required');
  }

  try {
    // Verify reset token
    const tokenDoc = await admin.firestore().collection('pinResetTokens').doc(resetToken).get();
    
    if (!tokenDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid reset token');
    }

    const tokenData = tokenDoc.data();
    
    if (tokenData.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Reset token does not match user');
    }

    if (tokenData.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError('deadline-exceeded', 'Reset token has expired');
    }

    // Hash the new PIN
    const saltRounds = 12;
    const hashedPin = await bcrypt.hash(newPin, saltRounds);

    // Update PIN in Firestore
    await admin.firestore().collection('pins').doc(userId).set({
      hashedPin,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Delete the reset token
    await admin.firestore().collection('pinResetTokens').doc(resetToken).delete();

    return { success: true };
  } catch (error) {
    console.error('Error resetting PIN:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reset PIN');
  }
});
