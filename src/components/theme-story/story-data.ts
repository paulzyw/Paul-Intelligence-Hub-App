export interface StoryField {
  label: string;
  value: string;
}

export interface StoryScene {
  id: string;
  chapter: string;
  title: string;
  description?: string;
  accentColor: string;
  badgeText: string;
  fields: StoryField[];
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
    badgeText: "Problem & Goal",
    title: "Start With What You Already Know",
    accentColor: "from-amber-500 to-orange-600",
    fields: [
      {
        label: "Business problem",
        value: "“cross-region resource latency”"
      },
      {
        label: "Business goal",
        value: "“Decrease system deployment times by 40% and establish automated configuration audit trails.”"
      }
    ],
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
    badgeText: "Evidence",
    title: "Qualify With Evidence, Not Assumptions",
    accentColor: "from-blue-500 to-indigo-600",
    fields: [
      {
        label: "Business Problem",
        value: "customer evidence has been supplied."
      },
      {
        label: "Metrics & Success Criteria",
        value: "target and measurement baseline need confirmation."
      },
      {
        label: "Commercial Readiness",
        value: "vendor qualification remains incomplete."
      }
    ],
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
    badgeText: "Qualification",
    title: "See What Supports the Opportunity—and What Puts It at Risk",
    accentColor: "from-emerald-500 to-teal-600",
    fields: [
      {
        label: "Example supporting finding",
        value: "“The customer has clearly articulated the business problem, demonstrating a strong understanding of the initiative's necessity.”"
      },
      {
        label: "Example risk",
        value: "“Vendor qualification is incomplete, which may delay the procurement process.”"
      }
    ],
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
    badgeText: "Next Actions",
    title: "Turn Qualification Gaps Into Practical Actions",
    accentColor: "from-purple-500 to-pink-600",
    fields: [
      {
        label: "Example action",
        value: "“Initiate vendor qualification process immediately to avoid procurement delays.”"
      },
      {
        label: "Dimension",
        value: "Commercial Readiness"
      },
      {
        label: "Impact",
        value: "Accelerated procurement timeline and reduced risk of slippage."
      }
    ],
    visualState: {
      gearRotation: 360,
      zoom: 1.1,
      complexity: 12,
      gridOpacity: 0.2,
      activeComponent: 'dial'
    }
  },
  {
    id: "chapter-five",
    chapter: "05",
    badgeText: "Decision",
    title: "Decide Whether the Opportunity Warrants Further Investment",
    accentColor: "from-teal-400 via-cyan-500 to-blue-600",
    fields: [
      {
        label: "Recommendation",
        value: "“This opportunity is a prime candidate for promotion to SQL, supported by robust executive alignment and a clear, quantified business case. The high level of customer engagement and the absence of an incumbent provide a strong competitive advantage, with immediate focus required only on finalizing vendor qualification and contractual terms.”"
      }
    ],
    visualState: {
      gearRotation: 450,
      zoom: 1.25,
      complexity: 14,
      gridOpacity: 0.4,
      activeComponent: 'escapement'
    }
  }
];
