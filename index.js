import messaging from '@react-native-firebase/messaging';
import { displayIncomingMessage } from './services/notification.service';

import 'expo-router/entry';

// Headless task for when the app is completely closed
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log("Killed app message:", remoteMessage);
    await displayIncomingMessage(remoteMessage);
});
