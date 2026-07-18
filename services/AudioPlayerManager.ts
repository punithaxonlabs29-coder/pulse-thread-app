import { Audio, AVPlaybackStatus } from 'expo-av';

class AudioPlayerManager {
  private currentSound: Audio.Sound | null = null;
  private currentAttachmentId: string | null = null;

  async play(attachmentId: string, uri: string, onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void): Promise<Audio.Sound> {
    // If a different audio is playing, stop it.
    if (this.currentSound && this.currentAttachmentId !== attachmentId) {
      await this.stopCurrent();
    }

    // Must call setAudioModeAsync before creating a Sound to initialise the
    // native audio session. Without this, expo-av throws
    // "Unable to activate keep awake" on Android.
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );

    if (onPlaybackStatusUpdate) {
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    }

    this.currentSound = sound;
    this.currentAttachmentId = attachmentId;

    return sound;
  }

  async pauseCurrent(): Promise<void> {
    if (this.currentSound) {
      await this.currentSound.pauseAsync();
    }
  }

  async resumeCurrent(): Promise<void> {
    if (this.currentSound) {
      await this.currentSound.playAsync();
    }
  }

  async stopCurrent(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (e) {
        console.log("Error unloading sound:", e);
      }
      this.currentSound = null;
      this.currentAttachmentId = null;
    }
  }

  getCurrentAttachmentId(): string | null {
    return this.currentAttachmentId;
  }
}

export default new AudioPlayerManager();
