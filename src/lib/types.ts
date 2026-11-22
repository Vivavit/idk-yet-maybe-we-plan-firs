export type ShareMode = "edit" | "view" | "private";

export type TimeOfDay = "Day" | "Golden Hour" | "Night" | "Indoor";

export type ShotSize =
  | "Wide"
  | "Medium"
  | "Close-Up"
  | "Detail"
  | "POV"
  | "Over-Shoulder";

export type CameraMovement =
  | "Static"
  | "Tripod"
  | "Pan / Tilt"
  | "Handheld + Gyroflow"
  | "Gimbal Push"
  | "Tracking";

export type PrepCategory = "gear" | "schedule" | "crew" | "location";

export interface Scene {
  id: string;
  orderIndex: number;
  title: string;
  location: string;
  timeOfDay: TimeOfDay;
  scriptText: string;
  notes: string;
}

export interface Shot {
  id: string;
  sceneId: string;
  orderIndex: number;
  shotNumber: string;
  description: string;
  shotSize: ShotSize;
  movement: CameraMovement;
  lens: string;
  cameraSettings: string;
  durationSec: number;
  storyboardUrl: string | null;
  isFilmed: boolean;
}

export interface ReferenceItem {
  id: string;
  sceneId: string | null;
  imageUrl: string;
  sourceUrl: string;
  caption: string;
  vibeTag: string;
  createdAt: string;
}

export interface PrepItem {
  id: string;
  category: PrepCategory;
  title: string;
  detail: string;
  timeSlot: string;
  isDone: boolean;
}

export interface Project {
  id: string;
  title: string;
  logline: string;
  fullScript: string;
  shareCode: string;
  shareMode: ShareMode;
  passcode?: string;
  shootDate: string;
  cameraProfile: string;
  targetLut: string;
  scenes: Scene[];
  shots: Shot[];
  references: ReferenceItem[];
  prepItems: PrepItem[];
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceTab = "script" | "shots" | "moodboard" | "prep" | "onset";
