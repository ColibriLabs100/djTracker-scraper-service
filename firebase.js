const admin = require('firebase-admin');

// Ensure that a Firebase app is not already initialized
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase...');
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // For production environments (like Vercel), use the environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // For local development, use application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

const messaging = admin.messaging();

async function sendPushNotification(token, post) {
  if (!admin.apps.length || !admin.apps[0].options.credential) {
    console.log('Firebase not configured, skipping notification');
    return;
  }
  
  const message = {
    data: {
      author: post.author,
      content: post.content,
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