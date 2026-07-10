import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import { ConnectsService } from './connects.service';
import { syncEngine } from './sync.engine';
import { messageRepository } from './message.repository';
import { Platform, Alert } from 'react-native';

// Export this helper so index.js can cleanly execute it without importing React components
export async function displayIncomingMessage(message: FirebaseMessagingTypes.RemoteMessage) {
  console.log("Background Message Arrived (Headless Task):", message);
  
  if (message.data?.title) {
    try {
      const channelId = message.data.channel_id as string;
      const messageId = message.data.message_id as string;
      
      if (channelId) {
        // Run incremental sync!
        // We might not know lastSync time easily here, so just sync last 200 without lastSync,
        // SyncEngine will deduplicate
        ConnectsService.syncMessages(channelId).then(async (syncData) => {
           if (syncData.status && syncData.new) {
             for (const msg of syncData.new) {
               await messageRepository.saveMessageLocal(msg);
               syncEngine.handleIncomingMessage(msg);
             }
           }
        }).catch(e => console.log("Background sync error:", e));
      }

      // Create channel in case it doesn't exist (crucial for killed state in Android 8+)
      await notifee.createChannel({
        id: 'high_importance_channel',
        name: 'High Importance Notifications',
        importance: AndroidImportance.HIGH,
      });

      const senderName = (message.data.senderName as string) || (message.data.title as string);
      
      await notifee.displayNotification({
        title: senderName,
        body: message.data.body as string,
        android: {
          channelId: 'high_importance_channel',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          style: {
            type: AndroidStyle.MESSAGING,
            person: {
              name: senderName,
            },
            messages: [
              {
                text: message.data.body as string,
                timestamp: Date.now(),
                person: {
                  name: senderName,
                },
              },
            ],
          },
          actions: [
            {
              title: 'Reply',
              icon: 'https://img.icons8.com/ios-glyphs/30/000000/reply-arrow.png',
              pressAction: { id: 'reply' },
              input: {
                allowFreeFormInput: true,
                placeholder: 'Type a message...',
              },
            },
            {
              title: 'Mark as read',
              pressAction: { id: 'mark_read' },
            },
          ],
        },
        data: message.data as any,
      });
    } catch (error) {
      console.log("Error displaying notification:", error);
    }
  }
}

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log("Notifee Background Event:", type, detail);
});

class NotificationService {
  private onNotificationTapped?: (channelId: string) => void;

  /**
   * Initialize notifications
   */
  async initialize(onNotificationTapped?: (channelId: string) => void) {
    this.onNotificationTapped = onNotificationTapped;
    
    await notifee.createChannel({
      id: 'high_importance_channel',
      name: 'High Importance Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await this.requestPermission();
    await this.registerDevice();
    this.registerForegroundListener();
    this.registerBackgroundListener();
    this.registerNotificationOpened();
    this.checkInitialNotification();
  }

  /**
   * Android 13+
   */
  async requestPermission() {
    const authStatus = await messaging().requestPermission();
    await notifee.requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log("Notification Permission:", enabled);
  }

  /**
   * Generate FCM token
   */
  async registerDevice() {
    await messaging().registerDeviceForRemoteMessages();

    const token = await messaging().getToken();

    console.log("FCM TOKEN:", token);
    
    if (token) {
        await ConnectsService.saveFCMToken(token, Platform.OS);
    }
    
    this.onTokenRefresh(async (newToken) => {
        console.log("FCM TOKEN REFRESHED:", newToken);
        await ConnectsService.saveFCMToken(newToken, Platform.OS);
    });

    return token;
  }

  /**
   * Token refresh
   */
  onTokenRefresh(callback: (token: string) => void) {
    return messaging().onTokenRefresh(callback);
  }

  /**
   * Foreground
   */
  registerForegroundListener() {
    // 1. Handle incoming push when app is already open
    messaging().onMessage(
      async (message: FirebaseMessagingTypes.RemoteMessage) => {
        console.log("Foreground Message Arrived:", message);
        if (message.data?.title) {
          const senderName = (message.data.senderName as string) || (message.data.title as string);
          
          const channelId = message.data.channel_id as string;
          if (channelId) {
            ConnectsService.syncMessages(channelId).then(async (syncData) => {
               if (syncData.status && syncData.new) {
                 for (const msg of syncData.new) {
                   await messageRepository.saveMessageLocal(msg);
                   syncEngine.handleIncomingMessage(msg);
                 }
               }
            }).catch(e => console.log("Foreground sync error:", e));
          }

          await notifee.displayNotification({
            title: senderName,
            body: message.data.body as string,
            android: {
              channelId: 'high_importance_channel',
              importance: AndroidImportance.HIGH,
              pressAction: { id: 'default' },
              style: {
                type: AndroidStyle.MESSAGING,
                person: { name: senderName },
                messages: [{
                  text: message.data.body as string,
                  timestamp: Date.now(),
                  person: { name: senderName },
                }],
              },
            },
            data: message.data as any,
          });
        }
      }
    );

    // 2. Handle when user clicks the Notifee banner while app is foregrounded or backgrounded
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification) {
        console.log("User clicked Notifee banner!", detail.notification);
        const channelId = detail.notification.data?.channel_id;
        if (channelId && this.onNotificationTapped) {
          this.onNotificationTapped(channelId as string);
        }
      }
    });
  }

  /**
   * Background task handled globally above
   */
  registerBackgroundListener() {
    // Moved to global scope to satisfy ReactNativeFirebaseMessagingHeadlessTask
  }

  /**
   * Handle notification open routing
   */
  private handleNotificationOpen(data: any) {
    const channelId = data?.channel_id;
    if (channelId && this.onNotificationTapped) {
      this.onNotificationTapped(channelId as string);
    }
  }

  /**
   * Notification tapped
   */
  registerNotificationOpened() {
    // Replaced by notifee.onForegroundEvent above
  }

  /**
   * App opened from killed state by clicking Notifee banner
   */
  async checkInitialNotification() {
    const initialNotification = await notifee.getInitialNotification();

    if (initialNotification) {
      console.log("App opened from Notifee banner (killed state)", initialNotification);
      this.handleNotificationOpen(initialNotification.notification.data);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
    } catch (e) {
      console.error("Error clearing notifications", e);
    }
  }
}
export default new NotificationService();
