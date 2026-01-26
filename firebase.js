const admin = require('firebase-admin');

// Ensure that a Firebase app is not already initialized
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase...');
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

const messaging = admin.messaging();

async function sendPushNotification(token, title, body) {
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Firebase not configured, skipping notification');
    return;
  }
  
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  try {
    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

module.exports = { sendPushNotification };