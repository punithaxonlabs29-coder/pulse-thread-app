export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
}

export interface EmojiOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

export interface EditableImage {
  id: string;
  originalUri: string;
  editedUri: string;
  drawings: Stroke[];
  texts: TextOverlay[];
  emojis: EmojiOverlay[];
  rotation: number;
  name: string;
  type: string;
}

export type EditorTool = "crop" | "rotate" | "draw" | "text" | "emoji";
