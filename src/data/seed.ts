export type Difficulty = 'Easy' | 'Moderate' | 'Hard'
export type ConditionTag = 'Dry' | 'Muddy' | 'Snow' | 'Icy' | 'Bugs' | 'Busy' | 'Closed'
export type AgeBracket = '18-29' | '30-39' | '40-49' | '50+'
export type Experience = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Trail {
  id: string
  name: string
  region: string
  difficulty: Difficulty
  distKm: number
  gainM: number
  typicalMin: number
  center: [number, number] // lng, lat
  path: [number, number][]
  elevation: number[]
  summary: string
}

export interface Hiker {
  id: string
  name: string
  age: AgeBracket
  level: Experience
  initials: string
}

export interface Run {
  id: string
  userId: string
  trailId: string
  timeSec: number
  /** Time spent moving. Stops are the gap between this and timeSec. */
  movingSec?: number
  timestamp: number
  conditions: ConditionTag[]
  note?: string
  selfReported?: boolean
  weather?: { temp: number; sky: string; wind: number }
}

export interface Comment {
  id: string
  userId: string
  text: string
  timestamp: number
}

export interface Review {
  id: string
  trailId: string
  userId: string
  rating: number
  text: string
  timestamp: number
}

export interface ConditionReport {
  id: string
  trailId: string
  userId: string
  tags: ConditionTag[]
  note?: string
  timestamp: number
  confirms: number
  kudos?: string[]
  comments?: Comment[]
}

export interface Crew {
  id: string
  name: string
  region: string
  members: string[]
  challenge: string
  challengeProgress: number
  challengeGoal: number
  challengeUnit: string
  /** Who may join the crew itself. Invites and requests stay on this phone until the app is hosted. */
  access?: 'public' | 'invite' | 'request'
  joinRequests?: string[]
  outing?: {
    trailId: string
    when: string
    going: string[]
    /** Trailhead or hike parking lot. */
    meet?: string
    /** Where the car leaves from, before the trailhead. */
    depart?: string
    pace?: 'easy' | 'steady' | 'pushing'
    driver?: string
    seats?: number
    whenIso?: string
    /** Solo hikers may join this plan without being in the crew already. */
    openToSolo?: boolean
    kudos?: string[]
    comments?: Comment[]
    rideRequests?: string[]
    /** People meeting at the trailhead, not taking a seat. */
    meeting?: string[]
  }
}

export interface TrailQuestion {
  id: string
  trailId: string
  userId: string
  text: string
  timestamp: number
  kudos?: string[]
  comments?: Comment[]
}

/** A challenge the whole lodge can join, separate from a crew-versus-crew duel. */
export interface LodgeChallenge {
  id: string
  lodgeId: string
  title: string
  metric: LodgeMetric
  startMs: number
  endMs: number
  joinedIds: string[]
}

export interface FeedItem {
  id: string
  type: 'pb' | 'hike' | 'condition' | 'outing' | 'post'
  userId: string
  trailId?: string
  crewId?: string
  text: string
  timestamp: number
  kudos: string[]
  comments?: Comment[]
}

export const CURRENT_USER_ID = 'you'

export const hikers: Hiker[] = [
  { id: 'you', name: 'You', age: '30-39', level: 'Intermediate', initials: 'YO' },
  { id: 'liam', name: 'Liam T.', age: '30-39', level: 'Advanced', initials: 'LT' },
  { id: 'maya', name: 'Maya R.', age: '18-29', level: 'Intermediate', initials: 'MR' },
  { id: 'chen', name: 'Chen W.', age: '40-49', level: 'Advanced', initials: 'CW' },
  { id: 'sofia', name: 'Sofia K.', age: '30-39', level: 'Beginner', initials: 'SK' },
  { id: 'jordan', name: 'Jordan P.', age: '50+', level: 'Intermediate', initials: 'JP' },
  { id: 'ava', name: 'Ava N.', age: '18-29', level: 'Advanced', initials: 'AN' },
]

/** Approximate Bow Valley / Kananaskis geometries for prototype demo */
export const trails: Trail[] = [
  {
    id: 'prairie-mountain',
    name: 'Prairie Mountain',
    region: 'Kananaskis',
    difficulty: 'Hard',
    distKm: 6.4,
    gainM: 726,
    typicalMin: 75,
    center: [-114.785, 50.887],
    path: [
      [-114.792, 50.879], [-114.79, 50.881], [-114.788, 50.883], [-114.786, 50.885],
      [-114.785, 50.887], [-114.783, 50.889], [-114.781, 50.891], [-114.78, 50.893],
      [-114.779, 50.894], [-114.778, 50.895],
    ],
    elevation: [0, 80, 180, 290, 420, 540, 630, 700, 726, 700],
    summary: 'Steep grind with a rewarding ridge view. A local favourite when you want to see if you can go faster.',
  },
  {
    id: 'ha-ling',
    name: 'Ha Ling Peak',
    region: 'Canmore',
    difficulty: 'Hard',
    distKm: 7.2,
    gainM: 810,
    typicalMin: 65,
    center: [-115.398, 51.064],
    path: [
      [-115.405, 51.055], [-115.403, 51.057], [-115.401, 51.059], [-115.4, 51.061],
      [-115.398, 51.063], [-115.397, 51.065], [-115.396, 51.067], [-115.395, 51.068],
      [-115.394, 51.069], [-115.393, 51.07],
    ],
    elevation: [0, 90, 200, 330, 470, 580, 680, 760, 810, 780],
    summary: 'The Canmore scramble everyone comes back to. Steep, short, and made for a second try.',
  },
  {
    id: 'grotto-canyon',
    name: 'Grotto Canyon',
    region: 'Canmore',
    difficulty: 'Easy',
    distKm: 4.2,
    gainM: 220,
    typicalMin: 50,
    center: [-115.268, 51.083],
    path: [
      [-115.275, 51.078], [-115.273, 51.079], [-115.271, 51.08], [-115.269, 51.082],
      [-115.268, 51.083], [-115.266, 51.085], [-115.265, 51.086], [-115.264, 51.087],
    ],
    elevation: [0, 20, 45, 80, 120, 160, 200, 220],
    summary: 'Frozen waterfall destination in winter; mellow canyon walk year-round.',
  },
  {
    id: 'heart-creek',
    name: 'Heart Creek',
    region: 'Bow Valley',
    difficulty: 'Easy',
    distKm: 4.8,
    gainM: 300,
    typicalMin: 65,
    center: [-115.168, 51.045],
    path: [
      [-115.175, 51.04], [-115.173, 51.041], [-115.171, 51.043], [-115.169, 51.044],
      [-115.168, 51.045], [-115.166, 51.046], [-115.165, 51.047], [-115.164, 51.048],
    ],
    elevation: [0, 30, 70, 120, 170, 220, 270, 300],
    summary: 'Creek-side climb to a waterfall. Conditions change fast after rain.',
  },
  {
    id: 'tunnel-mountain',
    name: 'Tunnel Mountain',
    region: 'Banff',
    difficulty: 'Moderate',
    distKm: 4.3,
    gainM: 260,
    typicalMin: 50,
    center: [-115.55, 51.183],
    path: [
      [-115.557, 51.178], [-115.555, 51.179], [-115.553, 51.181], [-115.551, 51.182],
      [-115.55, 51.183], [-115.548, 51.184], [-115.547, 51.185], [-115.546, 51.186],
    ],
    elevation: [0, 40, 90, 140, 180, 220, 250, 260],
    summary: 'Banff classic with town-and-valley views. A good first trail to come back to.',
  },
  {
    id: 'johnston-canyon',
    name: 'Johnston Canyon + Ink Pots',
    region: 'Banff',
    difficulty: 'Moderate',
    distKm: 11.7,
    gainM: 600,
    typicalMin: 140,
    center: [-115.84, 51.246],
    path: [
      [-115.855, 51.238], [-115.85, 51.24], [-115.846, 51.242], [-115.843, 51.244],
      [-115.84, 51.246], [-115.837, 51.248], [-115.834, 51.25], [-115.831, 51.252],
      [-115.828, 51.254], [-115.825, 51.255],
    ],
    elevation: [0, 40, 90, 140, 200, 280, 380, 480, 560, 600],
    summary: 'Catwalks to falls, then forest push to the Ink Pots — endurance test.',
  },
  {
    id: 'wasootch-ridge',
    name: 'Wasootch Ridge',
    region: 'Kananaskis',
    difficulty: 'Hard',
    distKm: 14.9,
    gainM: 790,
    typicalMin: 258,
    center: [-115.07, 50.95],
    path: [[-115.09, 50.97], [-115.05, 50.92]],
    elevation: [1450, 2240],
    summary: 'A long ridge above the Kananaskis valley. Out and back, with the climb stacked in the first half.',
  },
  {
    id: 'lady-macdonald',
    name: 'Lady MacDonald',
    region: 'Canmore',
    difficulty: 'Hard',
    distKm: 6.5,
    gainM: 855,
    typicalMin: 164,
    center: [-115.32, 51.1],
    path: [[-115.323, 51.092], [-115.318, 51.114]],
    elevation: [1410, 2268],
    summary: 'Steep east-slope climb above Canmore. The map follows the recorded route to the high point.',
  },
  {
    id: 'rawson-lake',
    name: 'Rawson Lake',
    region: 'Kananaskis',
    difficulty: 'Moderate',
    distKm: 3.4,
    gainM: 283,
    typicalMin: 69,
    center: [-115.2, 50.72],
    path: [[-115.2, 50.71], [-115.19, 50.73]],
    elevation: [1716, 1999],
    summary: 'A shorter climb to a high lake in the Kananaskis. The map follows the recorded route.',
  },
  {
    id: 'aylmer-lookout',
    name: 'Aylmer Lookout',
    region: 'Banff',
    difficulty: 'Easy',
    distKm: 3.2,
    gainM: 166,
    typicalMin: 55,
    center: [-115.52, 51.32],
    path: [[-115.53, 51.31], [-115.51, 51.33]],
    elevation: [1876, 2042],
    summary: 'A short lookout above Lake Minnewanka. Easy grade, big view.',
  },
  {
    id: 'plain-of-six-glaciers',
    name: 'Plain of Six Glaciers',
    region: 'Banff',
    difficulty: 'Moderate',
    distKm: 7.1,
    gainM: 389,
    typicalMin: 124,
    center: [-116.18, 51.41],
    path: [[-116.21, 51.42], [-116.16, 51.4]],
    elevation: [1700, 2100],
    summary: 'The walk from Lake Louise toward the glaciers. The map follows the recorded route, out and back.',
  },
]

const day = 24 * 60 * 60 * 1000
const now = Date.now()

export const seedRuns: Run[] = [
  // You — history on Ha Ling & Tunnel
  { id: 'r1', userId: 'you', trailId: 'ha-ling', timeSec: 3120, movingSec: 2940, timestamp: now - 3 * day, conditions: ['Dry'], note: 'Felt strong on the upper switchbacks', weather: { temp: 6, sky: 'Cloudy', wind: 11 } },
  { id: 'r2', userId: 'you', trailId: 'ha-ling', timeSec: 3280, timestamp: now - 18 * day, conditions: ['Muddy'] },
  { id: 'r3', userId: 'you', trailId: 'ha-ling', timeSec: 3450, timestamp: now - 40 * day, conditions: ['Dry'] },
  { id: 'r4', userId: 'you', trailId: 'tunnel-mountain', timeSec: 2480, timestamp: now - 5 * day, conditions: ['Dry'] },
  { id: 'r5', userId: 'you', trailId: 'tunnel-mountain', timeSec: 2620, timestamp: now - 22 * day, conditions: ['Busy'] },
  { id: 'r6', userId: 'you', trailId: 'prairie-mountain', timeSec: 4100, timestamp: now - 10 * day, conditions: ['Dry'] },
  { id: 'r7', userId: 'you', trailId: 'heart-creek', timeSec: 3180, timestamp: now - 7 * day, conditions: ['Muddy'] },

  // Liam — slightly faster on Ha Ling (chase target)
  { id: 'r8', userId: 'liam', trailId: 'ha-ling', timeSec: 2940, timestamp: now - 2 * day, conditions: ['Dry'] },
  { id: 'r9', userId: 'liam', trailId: 'ha-ling', timeSec: 3010, timestamp: now - 14 * day, conditions: ['Dry'] },
  { id: 'r10', userId: 'liam', trailId: 'prairie-mountain', timeSec: 3720, timestamp: now - 4 * day, conditions: ['Dry'] },

  // Others
  { id: 'r11', userId: 'maya', trailId: 'ha-ling', timeSec: 3360, timestamp: now - 1 * day, conditions: ['Dry'] },
  { id: 'r12', userId: 'chen', trailId: 'ha-ling', timeSec: 2880, timestamp: now - 6 * day, conditions: ['Dry'] },
  { id: 'r13', userId: 'ava', trailId: 'ha-ling', timeSec: 2790, timestamp: now - 8 * day, conditions: ['Dry'] },
  { id: 'r14', userId: 'sofia', trailId: 'tunnel-mountain', timeSec: 2900, timestamp: now - 2 * day, conditions: ['Busy'] },
  { id: 'r15', userId: 'jordan', trailId: 'tunnel-mountain', timeSec: 3100, timestamp: now - 9 * day, conditions: ['Dry'] },
  { id: 'r16', userId: 'maya', trailId: 'grotto-canyon', timeSec: 2400, timestamp: now - 1 * day, conditions: ['Icy'] },
  { id: 'r17', userId: 'chen', trailId: 'johnston-canyon', timeSec: 7200, timestamp: now - 3 * day, conditions: ['Dry'] },
  { id: 'r18', userId: 'ava', trailId: 'prairie-mountain', timeSec: 3540, timestamp: now - 5 * day, conditions: ['Dry'] },
  { id: 'r19', userId: 'liam', trailId: 'tunnel-mountain', timeSec: 2280, timestamp: now - 11 * day, conditions: ['Dry'] },
  { id: 'r20', userId: 'sofia', trailId: 'heart-creek', timeSec: 3600, timestamp: now - 4 * day, conditions: ['Bugs'] },

  // Your year, so the logbook chart has a season behind it. All slower than current bests.
  { id: 'r21', userId: 'you', trailId: 'tunnel-mountain', timeSec: 2800, timestamp: new Date(2026, 0, 18).getTime(), conditions: ['Dry'] },
  { id: 'r22', userId: 'you', trailId: 'heart-creek', timeSec: 3600, timestamp: new Date(2026, 1, 12).getTime(), conditions: ['Snow'] },
  { id: 'r23', userId: 'you', trailId: 'ha-ling', timeSec: 4000, timestamp: new Date(2026, 3, 20).getTime(), conditions: ['Dry'] },
  { id: 'r24', userId: 'you', trailId: 'prairie-mountain', timeSec: 4600, timestamp: new Date(2026, 4, 8).getTime(), conditions: ['Muddy'] },
  { id: 'r25', userId: 'you', trailId: 'grotto-canyon', timeSec: 2700, timestamp: new Date(2026, 5, 14).getTime(), conditions: ['Dry'] },
  { id: 'r26', userId: 'you', trailId: 'johnston-canyon', timeSec: 8000, timestamp: new Date(2026, 6, 19).getTime(), conditions: ['Busy'] },
  { id: 'r27', userId: 'you', trailId: 'ha-ling', timeSec: 3700, timestamp: new Date(2026, 7, 9).getTime(), conditions: ['Dry'] },
  { id: 'r28', userId: 'you', trailId: 'tunnel-mountain', timeSec: 2600, timestamp: new Date(2026, 8, 6).getTime(), conditions: ['Dry'] },
  { id: 'r29', userId: 'liam', trailId: 'wasootch-ridge', timeSec: 15000, timestamp: now - 6 * day, conditions: ['Dry'] },
  { id: 'r30', userId: 'maya', trailId: 'wasootch-ridge', timeSec: 16200, timestamp: now - 12 * day, conditions: ['Dry'] },
  { id: 'r31', userId: 'liam', trailId: 'lady-macdonald', timeSec: 9600, timestamp: now - 4 * day, conditions: ['Dry'] },
  { id: 'r32', userId: 'ava', trailId: 'lady-macdonald', timeSec: 10200, timestamp: now - 9 * day, conditions: ['Dry'] },
  { id: 'r33', userId: 'ava', trailId: 'rawson-lake', timeSec: 3900, timestamp: now - 3 * day, conditions: ['Dry'] },
  { id: 'r34', userId: 'chen', trailId: 'rawson-lake', timeSec: 4200, timestamp: now - 8 * day, conditions: ['Muddy'] },
  { id: 'r35', userId: 'sofia', trailId: 'aylmer-lookout', timeSec: 3300, timestamp: now - 2 * day, conditions: ['Dry'] },
  { id: 'r36', userId: 'jordan', trailId: 'aylmer-lookout', timeSec: 3600, timestamp: now - 11 * day, conditions: ['Busy'] },
  { id: 'r37', userId: 'liam', trailId: 'plain-of-six-glaciers', timeSec: 7200, timestamp: now - 5 * day, conditions: ['Dry'] },
  { id: 'r38', userId: 'maya', trailId: 'plain-of-six-glaciers', timeSec: 7800, timestamp: now - 13 * day, conditions: ['Dry'] },
]

export const seedReviews: Review[] = [
  { id: 'rv1', trailId: 'ha-ling', userId: 'liam', rating: 5, text: 'Upper section is dry. Bring poles for the descent — knees will thank you.', timestamp: now - 2 * day },
  { id: 'rv2', trailId: 'ha-ling', userId: 'maya', rating: 4, text: 'Busy after 9am. Sunrise start = empty ridge and cleaner times.', timestamp: now - 1 * day },
  { id: 'rv3', trailId: 'tunnel-mountain', userId: 'sofia', rating: 5, text: 'Perfect lunch hike. Views of town make every step worth it.', timestamp: now - 2 * day },
  { id: 'rv4', trailId: 'grotto-canyon', userId: 'maya', rating: 4, text: 'Ice is forming near the end — microspikes already useful.', timestamp: now - 1 * day },
  { id: 'rv5', trailId: 'prairie-mountain', userId: 'ava', rating: 5, text: 'No switchbacks to hide behind. Pure climb. Love it for intervals.', timestamp: now - 5 * day },
  { id: 'rv6', trailId: 'johnston-canyon', userId: 'chen', rating: 4, text: 'Crowded to the falls, peaceful after. Ink Pots were glassy.', timestamp: now - 3 * day },
  { id: 'rv7', trailId: 'heart-creek', userId: 'jordan', rating: 3, text: 'Muddy near the creek crossings after rain. Waterproof boots.', timestamp: now - 6 * day },
]

export const seedConditions: ConditionReport[] = [
  { id: 'c1', trailId: 'ha-ling', userId: 'liam', tags: ['Dry'], note: 'Dusty on the ridge, grippy.', timestamp: now - 10 * 60 * 60 * 1000, confirms: 4 },
  { id: 'c2', trailId: 'grotto-canyon', userId: 'maya', tags: ['Icy'], note: 'Ice lens past the pictographs.', timestamp: now - 20 * 60 * 60 * 1000, confirms: 6 },
  { id: 'c3', trailId: 'heart-creek', userId: 'sofia', tags: ['Muddy', 'Bugs'], note: 'Standing water mid-trail.', timestamp: now - 3 * day, confirms: 2 },
  { id: 'c4', trailId: 'tunnel-mountain', userId: 'jordan', tags: ['Busy', 'Dry'], timestamp: now - 36 * 60 * 60 * 1000, confirms: 3 },
  { id: 'c5', trailId: 'prairie-mountain', userId: 'ava', tags: ['Dry'], note: 'Wind at summit.', timestamp: now - 5 * day, confirms: 1 },
  { id: 'c6', trailId: 'johnston-canyon', userId: 'chen', tags: ['Busy'], note: 'Parking full by 8:30.', timestamp: now - 12 * day, confirms: 0 },
]

export const seedCrews: Crew[] = [
  {
    id: 'beltline',
    name: "Calgary Beltliner's",
    region: 'Calgary → Bow Valley',
    members: ['you', 'liam', 'maya', 'sofia', 'jordan'],
    challenge: 'October elevation push',
    challengeProgress: 18420,
    challengeGoal: 25000,
    challengeUnit: 'm',
    access: 'public',
    outing: {
      trailId: 'ha-ling',
      when: 'Sat 7:00 AM',
      going: ['liam', 'maya', 'you'],
      meet: 'Canmore Nordic Centre lot',
      depart: '17th Ave and 14th St SW, Calgary',
      pace: 'steady',
      driver: 'liam',
      seats: 4,
      openToSolo: true,
      kudos: ['liam'],
      comments: [{ id: 'oc1', userId: 'maya', text: 'I can drive if the usual car is full.', timestamp: now - 2 * 60 * 60 * 1000 }],
      rideRequests: ['sofia'],
      meeting: ['jordan'],
    },
  },
  {
    id: 'canmore-dawn',
    name: 'Canmore Dawn Patrol',
    region: 'Canmore',
    members: ['liam', 'chen', 'ava', 'you'],
    challenge: 'Most Ha Ling ascents',
    challengeProgress: 11,
    challengeGoal: 20,
    challengeUnit: 'summits',
    access: 'request',
  },
]

export type LodgeMetric = 'elevation' | 'distance'

export interface PersonalChallenge {
  title: string
  metric: LodgeMetric
  goal: number
}

export interface Lodge {
  id: string
  name: string
  region: string
  summary: string
  crewIds: string[]
  memberIds: string[]
}

/** A crew challenging another crew inside a lodge. Score is the average per person. */
export interface CrewDuel {
  id: string
  lodgeId: string
  title: string
  metric: LodgeMetric
  fromCrewId: string
  toCrewId: string
  status: 'pending' | 'active'
  startMs: number
  endMs: number
}

export const seedLodges: Lodge[] = [
  {
    id: 'bow-valley',
    name: 'Bow Valley',
    region: 'Alberta',
    summary: 'Everyone who hikes this valley. Your crew is the table you sit at. The lodge is the room. A lodge can be as wide as Hike Alberta.',
    crewIds: ['beltline', 'canmore-dawn'],
    memberIds: ['you', 'liam', 'maya', 'chen', 'sofia', 'jordan', 'ava'],
  },
]

export const seedDuels: CrewDuel[] = [
  {
    id: 'd1',
    lodgeId: 'bow-valley',
    title: 'Elevation over the last 30 days',
    metric: 'elevation',
    fromCrewId: 'beltline',
    toCrewId: 'canmore-dawn',
    status: 'active',
    startMs: now - 30 * day,
    endMs: now + day,
  },
]

export const seedQuestions: TrailQuestion[] = [
  { id: 'q1', trailId: 'ha-ling', userId: 'sofia', text: 'Are poles worth it on the way down if the ridge is dry?', timestamp: now - 2 * day },
]

export const seedLodgeChallenges: LodgeChallenge[] = [
  {
    id: 'lc1',
    lodgeId: 'bow-valley',
    title: 'Valley elevation',
    metric: 'elevation',
    startMs: now - 30 * day,
    endMs: now + day,
    joinedIds: ['liam', 'maya', 'ava'],
  },
]

export const seedFeed: FeedItem[] = [
  {
    id: 'f1',
    type: 'outing',
    userId: 'liam',
    trailId: 'ha-ling',
    crewId: 'beltline',
    text: 'Heading up Ha Ling Saturday 7am — who’s in?',
    timestamp: now - 5 * 60 * 60 * 1000,
    kudos: ['maya', 'sofia'],
  },
  {
    id: 'f2',
    type: 'pb',
    userId: 'ava',
    trailId: 'prairie-mountain',
    text: 'New PB on Prairie — 59:00. Legs are toast.',
    timestamp: now - 5 * day,
    kudos: ['liam', 'chen', 'you'],
  },
  {
    id: 'f3',
    type: 'condition',
    userId: 'maya',
    trailId: 'grotto-canyon',
    text: 'Icy near the end — microspikes recommended.',
    timestamp: now - 20 * 60 * 60 * 1000,
    kudos: ['jordan'],
  },
  {
    id: 'f4',
    type: 'hike',
    userId: 'chen',
    trailId: 'johnston-canyon',
    text: 'Ink Pots out-and-back. Steady pace, no drama.',
    timestamp: now - 3 * day,
    kudos: ['ava'],
  },
  {
    id: 'f5',
    type: 'pb',
    userId: 'liam',
    trailId: 'ha-ling',
    text: 'Took 3 minutes off Ha Ling. Dry ridge helped.',
    timestamp: now - 2 * day,
    kudos: ['you', 'maya', 'ava'],
    comments: [{ id: 'cm1', userId: 'you', text: 'Saving a Saturday to try that line with you.', timestamp: now - 1 * day }],
  },
]

export function getTrail(id: string) {
  return trails.find((t) => t.id === id)
}

export function getHiker(id: string) {
  return hikers.find((h) => h.id === id)
}
