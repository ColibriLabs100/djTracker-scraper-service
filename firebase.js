const admin = require('firebase-admin');

// IMPORTANT: You must set the FIREBASE_SERVICE_ACCOUNT environment variable.
// It should be a base64 encoded string of your Firebase service account JSON file.
// For local development, you can create a .env file:
// FIREBASE_SERVICE_ACCOUNT="your_base64_encoded_service_account_json"

try {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('ascii')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('Firebase Admin SDK initialized successfully.');

} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.log('Firebase Admin SDK not initialized. Push notifications will be disabled.');
  // We don't want to crash the app if Firebase fails to initialize,
  // as the core scraping functionality can still work.
}

async function sendPushNotification(pushToken, title, body) {
  if (!admin.apps.length) {
    console.log('Firebase not initialized, skipping push notification.');
    return;
  }

  const message = {
    notification: {
      title,
      body,
    },
    token: pushToken,
  };

  try {
    await admin.messaging().send(message);
    console.log('Successfully sent push notification to token:', pushToken);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

module.exports = { sendPushNotification };
