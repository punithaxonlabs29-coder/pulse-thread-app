import React from "react";
import { StyleSheet, Text, View, Image, Linking, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VideoAttachment from "./VideoAttachment";
import ImageAttachment from "./ImageAttachment";

interface MessageBubbleProps {
  messageId: string;
  text: string;
  time: string;
  isMine: boolean;
  attachments?: any[];
}

export default function MessageBubble({ messageId, text, time, isMine, attachments }: MessageBubbleProps) {
  return (
    <View
      style={[
        styles.messageContainer,
        isMine ? styles.myMessage : styles.otherMessage,
      ]}
    >
      {text ? (
        <Text
          style={[
            styles.messageText,
            isMine ? styles.myMessageText : styles.otherMessageText,
          ]}
        >
          {text}
        </Text>
      ) : null}

      {attachments?.map((file, index) => {
        const type = file.type || file.mime_type || "";
        const url = file.url || file.file_url;
        const name = file.name || "Attachment";

        // IMAGE
        if (type.startsWith("image/")) {
          return (
            <ImageAttachment
              key={index}
              url={url || ""}
              name={name}
              messageId={messageId}
            />
          );
        }

        // VIDEO
        if (type.startsWith("video/") || name.endsWith(".webm") || name.endsWith(".mp4")) {
          return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} isMine={isMine} type="video" />;
        }

        // AUDIO
        if (type.startsWith("audio/")) {
          return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} isMine={isMine} type="audio" />;
        }

        // DOCUMENT
        return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} isMine={isMine} type="document" />;
      })}

      <Text style={[styles.time, isMine ? styles.myTimeText : styles.otherTimeText]}>
        {time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: "75%",
    marginVertical: 6,
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2563EB",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#111827",
  },
  time: {
    alignSelf: "flex-end",
    fontSize: 11,
    marginTop: 6,
  },
  myTimeText: {
    color: "#DBEAFE",
  },
  otherTimeText: {
    color: "#6B7280",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  fileName: {
    marginLeft: 8,
    color: "#2563EB",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  myFileName: {
    color: "#FFFFFF",
  }
});
