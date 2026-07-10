import React from 'react';
import ImageAttachment from '../ImageAttachment';
import VideoAttachment from '../VideoAttachment';

interface AttachmentsProps {
  attachments?: any[];
  messageId: string;
  time: string;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  isMine: boolean;
  showOverlayTime: boolean;
  isVisible: boolean;
}

export const Attachments = React.memo(({ 
  attachments, 
  messageId, 
  time, 
  readStatus, 
  isMine, 
  showOverlayTime,
  isVisible 
}: AttachmentsProps) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <>
      {attachments.map((file, index) => {
        const type = file.type || file.mime_type || "";
        const url = file.url || file.file_url;
        const name = file.name || "Attachment";

        const mediaProps = {
            time: showOverlayTime ? time : undefined,
            readStatus: showOverlayTime ? readStatus : undefined,
            isMine
        };

        if (type.startsWith("image/")) {
          return <ImageAttachment key={index} url={url || ""} name={name} messageId={messageId} {...mediaProps} />;
        }
        if (type.startsWith("video/") || name.endsWith(".webm") || name.endsWith(".mp4")) {
          return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} type="video" isVisible={isVisible} {...mediaProps} />;
        }
        if (type.startsWith("audio/")) {
          return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} type="audio" isVisible={isVisible} {...mediaProps} />;
        }
        if (type.toLowerCase() === "link" || file.file_type === "Link") {
          return null;
        }
        return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} type="document" {...mediaProps} />;
      })}
    </>
  );
}, (prev, next) => {
  return JSON.stringify(prev.attachments) === JSON.stringify(next.attachments) &&
         prev.isVisible === next.isVisible &&
         prev.showOverlayTime === next.showOverlayTime &&
         prev.readStatus === next.readStatus;
});
