export type Course = {
  slug: string;
  name: string;
  level: string;
  php: number;
  usd: number;
  duration: string;
  depth: string;
  summary: string;
  includes: string[];
};

export const courses: Course[] = [
  {
    slug: "discover-scuba",
    name: "Discover Scuba Diving",
    level: "Try dive",
    php: 4500,
    usd: 79,
    duration: "Half day",
    depth: "12 m",
    summary:
      "Your first breaths underwater at Napaling reef, guided one-on-one by an instructor. No certification needed.",
    includes: ["1 guided dive", "Full equipment", "Briefing & shore practice", "Boat transfer"],
  },
  {
    slug: "open-water",
    name: "PADI Open Water Diver",
    level: "Beginner",
    php: 21500,
    usd: 375,
    duration: "3–4 days",
    depth: "18 m",
    summary:
      "The licence that lets you dive anywhere in the world. Theory, confined sessions and four open water dives around Panglao.",
    includes: [
      "4 open water dives",
      "eLearning & certification",
      "Equipment rental",
      "Small groups (max 4)",
    ],
  },
  {
    slug: "advanced-open-water",
    name: "PADI Advanced Open Water",
    level: "Intermediate",
    php: 19500,
    usd: 340,
    duration: "2–3 days",
    depth: "30 m",
    summary:
      "Five adventure dives including deep and navigation, run on the Balicasag walls and Doljo point.",
    includes: ["5 adventure dives", "Deep & navigation", "Certification fees", "Boat & tanks"],
  },
  {
    slug: "rescue-diver",
    name: "PADI Rescue Diver",
    level: "Advanced",
    php: 23500,
    usd: 410,
    duration: "3 days",
    depth: "30 m",
    summary:
      "Become the diver everyone wants as a buddy. Scenario training in the calm bays of Panglao.",
    includes: ["10 rescue scenarios", "EFR primary care", "Certification fees", "Equipment"],
  },
  {
    slug: "divemaster",
    name: "PADI Divemaster",
    level: "Professional",
    php: 62000,
    usd: 1080,
    duration: "4–8 weeks",
    depth: "40 m",
    summary:
      "Go pro in Bohol. Work alongside our instructors on daily boats, guide certified divers and build real experience.",
    includes: ["60+ logged dives", "Crew pack & application", "Internship placement", "Mentoring"],
  },
  {
    slug: "nitrox",
    name: "Enriched Air Nitrox",
    level: "Specialty",
    php: 8500,
    usd: 148,
    duration: "1 day",
    depth: "—",
    summary: "Longer bottom times on the deeper Balicasag walls. Theory plus two nitrox dives.",
    includes: ["2 nitrox dives", "Analyser training", "Certification", "Tanks & fills"],
  },
];

export type DiveSite = {
  name: string;
  tag: string;
  depth: string;
  level: string;
  description: string;
  highlights: string[];
};

export const diveSites: DiveSite[] = [
  {
    name: "Balicasag Marine Sanctuary",
    tag: "Signature wall",
    depth: "5–40 m",
    level: "All levels",
    description:
      "A 25-minute boat ride from Alona. A sheer coral wall dropping into the blue, with resident turtles and a tornado of jackfish that circles the shallows.",
    highlights: ["Jackfish tornado", "Green turtles", "Black coral wall", "Great visibility"],
  },
  {
    name: "Napaling Reef",
    tag: "Sardine run",
    depth: "3–35 m",
    level: "All levels",
    description:
      "The famous Bohol sardine run, reachable straight from shore. Millions of sardines form shifting silver walls just five metres down.",
    highlights: ["Sardine shoals", "Shore entry", "Night dives", "Freediver friendly"],
  },
  {
    name: "Pamilacan Island",
    tag: "Big blue",
    depth: "10–40 m",
    level: "Advanced",
    description:
      "Open-water pinnacles an hour offshore, where dolphins and passing whale sharks share the drop-offs with schooling barracuda.",
    highlights: ["Dolphin sightings", "Barracuda", "Steep drop-offs", "Blue water diving"],
  },
  {
    name: "Doljo Point",
    tag: "Drift",
    depth: "12–35 m",
    level: "Advanced",
    description:
      "A current-swept corner on the west tip of Panglao. Drift the slope past gorgonians and look out for eagle rays cruising the edge.",
    highlights: ["Eagle rays", "Gorgonian fans", "Mild drift", "Macro life"],
  },
  {
    name: "Arco Point (Hole in the Wall)",
    tag: "Swim-through",
    depth: "5–30 m",
    level: "Open Water+",
    description:
      "A chimney at 12 metres opens onto the reef face. Perfect second dive, packed with frogfish, nudibranchs and seahorses.",
    highlights: ["Chimney swim-through", "Frogfish", "Seahorses", "Macro paradise"],
  },
  {
    name: "Cervera Shoal (Snake Island)",
    tag: "Unique",
    depth: "10–35 m",
    level: "Advanced",
    description:
      "A long ridge between Bohol and Balicasag known for banded sea kraits weaving over the sand and hunting trevally.",
    highlights: ["Sea snakes", "Sand ridge", "Trevally", "Sharks occasionally"],
  },
];
