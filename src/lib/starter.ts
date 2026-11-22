import { Project } from "./types";
import { generateId, generateShareCode } from "./db";

export function createStarterProject(): Project {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const scene1Id = generateId("scn");
  const scene2Id = generateId("scn");
  const scene3Id = generateId("scn");

  return {
    id: generateId("proj"),
    title: "Quiet Morning — Solo Short",
    logline:
      "A stillness-driven visual study following an early morning routine before the city wakes up.",
    fullScript: `TITLE: QUIET MORNING
RUNTIME: ~45 SECONDS

[SCENE 1 — APARTMENT BEDROOM — GOLDEN HOUR]
Soft morning light cuts across the desk. Dust particles drift slowly. Silence except for distant traffic.

VO:
"Most days start before you notice them."

Hands open a blank notebook. Pen hovers for a beat.

[SCENE 2 — KITCHEN COUNTER — INDOOR]
Sound design focus: kettle hum, water pouring slowly, ceramic cup set down on wood.
No dialogue. Let the rhythm breathe. Steam curls upward in the backlight.

[SCENE 3 — STREET CORNER / CROSSWALK — DAY]
Wide static frame holds steady as the subject steps out of the building and walks across the frame into morning traffic.

VO:
"And then the world turns back on."

CUT TO BLACK.`,
    shareCode: generateShareCode(),
    shareMode: "edit",
    shootDate: today,
    cameraProfile: "Sony ZV-E10 · 4K 24p · Cine2 · 1/50",
    targetLut: "Clean Film Rec.709",
    createdAt: now,
    updatedAt: now,
    scenes: [
      {
        id: scene1Id,
        orderIndex: 0,
        title: "Scene 1 — Window Light",
        location: "Apartment Bedroom",
        timeOfDay: "Golden Hour",
        scriptText:
          "VO: \"Most days start before you notice them.\"\n\nSoft morning light cuts across the desk. Dust particles drift slowly. Silence except for distant traffic.",
        notes: "Shoot against natural window light. Keep curtains half-drawn for soft contrast.",
      },
      {
        id: scene2Id,
        orderIndex: 1,
        title: "Scene 2 — Pour Over Ritual",
        location: "Kitchen Counter",
        timeOfDay: "Indoor",
        scriptText:
          "Sound design focus: kettle hum, water pouring, ceramic cup set down on wood.\n\nNo dialogue. Let the rhythm breathe.",
        notes: "Record clean room tone and close foley audio with external mic.",
      },
      {
        id: scene3Id,
        orderIndex: 2,
        title: "Scene 3 — Stepping Outside",
        location: "Street Corner / Crosswalk",
        timeOfDay: "Day",
        scriptText:
          "VO: \"And then the world turns back on.\"\n\nWide frame holds steady as the subject walks out of frame into morning traffic.",
        notes: "Lock exposure before subject enters frame. Use ND filter if sunlight is harsh.",
      },
    ],
    shots: [
      {
        id: generateId("sht"),
        sceneId: scene1Id,
        orderIndex: 0,
        shotNumber: "1A",
        description: "Wide static establishing frame of window light hitting the desk",
        shotSize: "Wide",
        movement: "Tripod",
        lens: "16mm f/1.4",
        cameraSettings: "4K 24p · 1/50 · ISO 400 · Cine2",
        durationSec: 6,
        storyboardUrl: null,
        isFilmed: false,
      },
      {
        id: generateId("sht"),
        sceneId: scene1Id,
        orderIndex: 1,
        shotNumber: "1B",
        description: "Close-up of hands opening notebook on desk",
        shotSize: "Close-Up",
        movement: "Static",
        lens: "35mm f/1.8",
        cameraSettings: "4K 24p · 1/50 · ISO 400 · Cine2",
        durationSec: 4,
        storyboardUrl: null,
        isFilmed: false,
      },
      {
        id: generateId("sht"),
        sceneId: scene2Id,
        orderIndex: 2,
        shotNumber: "2A",
        description: "Detail macro of steam rising from freshly poured coffee",
        shotSize: "Detail",
        movement: "Tripod",
        lens: "50mm f/1.8",
        cameraSettings: "1080p 60p · 1/125 · ISO 640",
        durationSec: 5,
        storyboardUrl: null,
        isFilmed: false,
      },
      {
        id: generateId("sht"),
        sceneId: scene2Id,
        orderIndex: 3,
        shotNumber: "2B",
        description: "Slow handheld push-in across counter as cup is lifted",
        shotSize: "Medium",
        movement: "Handheld + Gyroflow",
        lens: "24mm f/1.4",
        cameraSettings: "4K 24p · 1/100 · Gyroflow Active",
        durationSec: 4,
        storyboardUrl: null,
        isFilmed: false,
      },
      {
        id: generateId("sht"),
        sceneId: scene3Id,
        orderIndex: 4,
        shotNumber: "3A",
        description: "Wide street corner frame, subject crosses left-to-right",
        shotSize: "Wide",
        movement: "Tripod",
        lens: "16mm f/2.8",
        cameraSettings: "4K 24p · 1/50 · VND 2-5",
        durationSec: 8,
        storyboardUrl: null,
        isFilmed: false,
      },
    ],
    references: [
      {
        id: generateId("ref"),
        sceneId: scene1Id,
        imageUrl: "",
        sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        caption: "Soft directional morning light & negative space framing",
        vibeTag: "Lighting",
        createdAt: now,
      },
    ],
    prepItems: [
      {
        id: generateId("prp"),
        category: "gear",
        title: "Sony ZV-E10 Body + 2x Charged Batteries",
        detail: "Format SD card (V30 128GB) before shoot",
        timeSlot: "",
        isDone: false,
      },
      {
        id: generateId("prp"),
        category: "gear",
        title: "16mm f/1.4 + 35mm f/1.8 Lenses + VND Filter",
        detail: "Clean front elements & pack lens cloth",
        timeSlot: "",
        isDone: false,
      },
      {
        id: generateId("prp"),
        category: "gear",
        title: "Compact Tripod + Quick Release Plate",
        detail: "Check head tension for smooth pans",
        timeSlot: "",
        isDone: false,
      },
      {
        id: generateId("prp"),
        category: "gear",
        title: "Shotgun Mic / Lav + Windscreen",
        detail: "Test audio levels (-12dB peak)",
        timeSlot: "",
        isDone: false,
      },
      {
        id: generateId("prp"),
        category: "schedule",
        title: "Gear Check & Window Light Setup",
        detail: "Test exposure & white balance (5600K)",
        timeSlot: "06:15",
        isDone: false,
      },
      {
        id: generateId("prp"),
        category: "schedule",
        title: "Shoot Scene 1 & Scene 2 (Indoor)",
        detail: "Capture room tone after Scene 2",
        timeSlot: "06:45",
        isDone: false,
      },
      {
        id: generateId("prp"),
        category: "schedule",
        title: "Move Outside for Scene 3",
        detail: "Before harsh overhead sun",
        timeSlot: "08:00",
        isDone: false,
      },
      {
        id: generateId("prp"),
        category: "crew",
        title: "Director / Camera Op",
        detail: "Solo lead — framing, focus, audio check",
        timeSlot: "",
        isDone: false,
      },
      {
        id: generateId("prp"),
        category: "location",
        title: "Apartment + Crosswalk (2 min walk)",
        detail: "No permit needed, handheld/compact tripod only",
        timeSlot: "",
        isDone: false,
      },
    ],
  };
}

export function createBlankProject(title = "Untitled Shoot"): Project {
  const now = new Date().toISOString();
  const scene1Id = generateId("scn");

  return {
    id: generateId("proj"),
    title,
    logline: "",
    fullScript: "",
    shareCode: generateShareCode(),
    shareMode: "edit",
    shootDate: now.slice(0, 10),
    cameraProfile: "4K 24p · 1/50",
    targetLut: "Neutral Rec.709",
    createdAt: now,
    updatedAt: now,
    scenes: [
      {
        id: scene1Id,
        orderIndex: 0,
        title: "Scene 1",
        location: "Location",
        timeOfDay: "Day",
        scriptText: "",
        notes: "",
      },
    ],
    shots: [],
    references: [],
    prepItems: [],
  };
}
