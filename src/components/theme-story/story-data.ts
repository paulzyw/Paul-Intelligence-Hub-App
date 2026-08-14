export interface StoryScene {
  id: string;
  chapter: string;
  title: string;
  description: string;
  accentColor: string;
  badgeText: string;
  visualState: {
    gearRotation: number;
    zoom: number;
    complexity: number;
    gridOpacity: number;
    activeComponent: 'escapement' | 'balance-wheel' | 'train' | 'dial';
  };
}

export const STORY_SCENES: StoryScene[] = [
  {
    id: "chapter-one",
    chapter: "01",
    badgeText: "Concept & Geometry",
    title: "The Architecture of Gravity",
    description: "Every mechanical watch begins as a mathematical conquest over gravity. By harnessing the tension of a coiled mainspring, energy is channeled through a train of microscopic gears to create a steady, rhythmic pulse.",
    accentColor: "from-amber-500 to-orange-600",
    visualState: {
      gearRotation: 45,
      zoom: 1.0,
      complexity: 3,
      gridOpacity: 0.25,
      activeComponent: 'escapement'
    }
  },
  {
    id: "chapter-two",
    chapter: "02",
    badgeText: "The Heartbeat",
    title: "Escapement & Oscillation",
    description: "At the center sits the escapement—the clockwork’s mechanical heart. This dual-action wheel oscillates thousands of times per hour, dividing raw kinetic force into precise, fractional increments of a second.",
    accentColor: "from-blue-500 to-indigo-600",
    visualState: {
      gearRotation: 135,
      zoom: 1.3,
      complexity: 6,
      gridOpacity: 0.4,
      activeComponent: 'balance-wheel'
    }
  },
  {
    id: "chapter-three",
    chapter: "03",
    badgeText: "The Complications",
    title: "Layered Complications",
    description: "In high horology, a complication is any function beyond simple timekeeping. Chronographs, lunar calendars, and power indicators are stacked layer-upon-layer in an intricate, microscopic ballet of solid brass.",
    accentColor: "from-emerald-500 to-teal-600",
    visualState: {
      gearRotation: 270,
      zoom: 1.5,
      complexity: 9,
      gridOpacity: 0.5,
      activeComponent: 'train'
    }
  },
  {
    id: "chapter-four",
    chapter: "04",
    badgeText: "The Bespoke Canvas",
    title: "Bespoke Personalization",
    description: "A mechanical masterpiece is incomplete without its final character. Tailor the face, customize the skeleton dials, and choose high-contrast finishes to translate raw engineering into your personal visual identity.",
    accentColor: "from-purple-500 to-pink-600",
    visualState: {
      gearRotation: 360,
      zoom: 1.1,
      complexity: 12,
      gridOpacity: 0.2,
      activeComponent: 'dial'
    }
  }
];
