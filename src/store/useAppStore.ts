import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CURRENT_USER_ID,
  type ConditionReport,
  type ConditionTag,
  type FeedItem,
  type Review,
  type Run,
  seedConditions,
  seedCrews,
  seedFeed,
  seedReviews,
  seedRuns,
  type Crew,
} from '../data/seed'

export interface ChaseTarget {
  trailId: string
  userId: string
  timeSec: number
  label: string
}

export interface ActiveRecording {
  trailId: string
  startedAt: number
  elapsedMs: number
  paused: boolean
  chase?: ChaseTarget
}

export interface LastResult {
  trailId: string
  timeSec: number
  previousBest?: number
  isPb: boolean
  chase?: ChaseTarget
  deltaToChase?: number
  rankBefore?: number
  rankAfter?: number
}

interface AppState {
  runs: Run[]
  reviews: Review[]
  conditions: ConditionReport[]
  feed: FeedItem[]
  crews: Crew[]
  joinedCrewIds: string[]
  savedTrailIds: string[]
  packedTrailIds: string[]
  onboarded: boolean
  chase?: ChaseTarget
  recording?: ActiveRecording
  lastResult?: LastResult
  ageBracket: '18-29' | '30-39' | '40-49' | '50+'
  experience: 'Beginner' | 'Intermediate' | 'Advanced'
  displayName: string

  setChase: (chase?: ChaseTarget) => void
  setAgeBracket: (age: AppState['ageBracket']) => void
  setExperience: (level: AppState['experience']) => void
  setDisplayName: (name: string) => void
  toggleSaveTrail: (trailId: string) => void
  joinCrew: (crewId: string) => void
  toggleKudo: (feedId: string) => void
  confirmCondition: (id: string) => void
  addCondition: (trailId: string, tags: ConditionTag[], note?: string) => void
  addReview: (trailId: string, rating: number, text: string) => void
  startRecording: (trailId: string, chase?: ChaseTarget) => void
  pauseRecording: () => void
  resumeRecording: () => void
  tickRecording: () => void
  finishRecording: (opts?: { conditions?: ConditionTag[]; note?: string; adjustSec?: number }) => LastResult | undefined
  clearResult: () => void
  logManualRun: (trailId: string, timeSec: number, conditions: ConditionTag[]) => void
  createOuting: (crewId: string, plan: { trailId: string; when: string; meet: string; pace: 'easy' | 'steady' | 'pushing'; driver: string; seats: number; whenIso?: string }) => void
  createCrew: (name: string, region: string, inviteIds: string[]) => void
  addComment: (feedId: string, text: string) => void
  packTrail: (trailId: string) => void
  finishOnboarding: (knownTrailIds: string[]) => void
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      runs: seedRuns,
      reviews: seedReviews,
      conditions: seedConditions,
      feed: seedFeed,
      crews: seedCrews,
      joinedCrewIds: ['beltline'],
      savedTrailIds: ['ha-ling', 'tunnel-mountain'],
      packedTrailIds: ['ha-ling'],
      onboarded: false,
      chase: {
        trailId: 'ha-ling',
        userId: 'liam',
        timeSec: 2940,
        label: 'Liam T.',
      },
      ageBracket: '30-39',
      experience: 'Intermediate',
      displayName: '',

      setChase: (chase) => set({ chase }),

      setAgeBracket: (ageBracket) => set({ ageBracket }),

      setExperience: (experience) => set({ experience }),

      setDisplayName: (displayName) => set({ displayName: displayName.trim() }),

      toggleSaveTrail: (trailId) =>
        set((s) => ({
          savedTrailIds: s.savedTrailIds.includes(trailId)
            ? s.savedTrailIds.filter((id) => id !== trailId)
            : [...s.savedTrailIds, trailId],
        })),

      joinCrew: (crewId) =>
        set((s) => ({
          joinedCrewIds: s.joinedCrewIds.includes(crewId)
            ? s.joinedCrewIds
            : [...s.joinedCrewIds, crewId],
          crews: s.crews.map((c) =>
            c.id === crewId && !c.members.includes(CURRENT_USER_ID)
              ? { ...c, members: [...c.members, CURRENT_USER_ID] }
              : c,
          ),
        })),

      toggleKudo: (feedId) =>
        set((s) => ({
          feed: s.feed.map((f) => {
            if (f.id !== feedId) return f
            const has = f.kudos.includes(CURRENT_USER_ID)
            return {
              ...f,
              kudos: has
                ? f.kudos.filter((k) => k !== CURRENT_USER_ID)
                : [...f.kudos, CURRENT_USER_ID],
            }
          }),
        })),

      confirmCondition: (id) =>
        set((s) => ({
          conditions: s.conditions.map((c) =>
            c.id === id ? { ...c, confirms: c.confirms + 1, timestamp: Date.now() } : c,
          ),
        })),

      addCondition: (trailId, tags, note) =>
        set((s) => {
          const report: ConditionReport = {
            id: uid('c'),
            trailId,
            userId: CURRENT_USER_ID,
            tags,
            note,
            timestamp: Date.now(),
            confirms: 0,
          }
          const feedItem: FeedItem = {
            id: uid('f'),
            type: 'condition',
            userId: CURRENT_USER_ID,
            trailId,
            text: `${tags.join(' · ')}${note ? ` — ${note}` : ''}`,
            timestamp: Date.now(),
            kudos: [],
          }
          return {
            conditions: [report, ...s.conditions],
            feed: [feedItem, ...s.feed],
          }
        }),

      addReview: (trailId, rating, text) =>
        set((s) => ({
          reviews: [
            {
              id: uid('rv'),
              trailId,
              userId: CURRENT_USER_ID,
              rating,
              text,
              timestamp: Date.now(),
            },
            ...s.reviews,
          ],
        })),

      startRecording: (trailId, chase) =>
        set({
          recording: {
            trailId,
            startedAt: Date.now(),
            elapsedMs: 0,
            paused: false,
            chase,
          },
        }),

      pauseRecording: () =>
        set((s) =>
          s.recording ? { recording: { ...s.recording, paused: true } } : {},
        ),

      resumeRecording: () =>
        set((s) =>
          s.recording
            ? { recording: { ...s.recording, paused: false, startedAt: Date.now() } }
            : {},
        ),

      tickRecording: () => {
        const rec = get().recording
        if (!rec || rec.paused) return
        const delta = Date.now() - rec.startedAt
        set({
          recording: {
            ...rec,
            startedAt: Date.now(),
            elapsedMs: rec.elapsedMs + delta,
          },
        })
      },

      finishRecording: (opts) => {
        const rec = get().recording
        if (!rec) return undefined
        const timeSec = Math.max(1, Math.round(rec.elapsedMs / 1000) + (opts?.adjustSec ?? 0))
        const trailId = rec.trailId
        const yourRuns = get().runs.filter(
          (r) => r.userId === CURRENT_USER_ID && r.trailId === trailId,
        )
        const previousBest = yourRuns.length
          ? Math.min(...yourRuns.map((r) => r.timeSec))
          : undefined
        const isPb = previousBest === undefined || timeSec < previousBest

        const allBefore = get()
          .runs.filter((r) => r.trailId === trailId)
          .reduce<Record<string, number>>((acc, r) => {
            acc[r.userId] = Math.min(acc[r.userId] ?? Infinity, r.timeSec)
            return acc
          }, {})
        const sortedBefore = Object.entries(allBefore).sort((a, b) => a[1] - b[1])
        const rankBefore = sortedBefore.findIndex(([id]) => id === CURRENT_USER_ID) + 1 || undefined

        const run: Run = {
          id: uid('r'),
          userId: CURRENT_USER_ID,
          trailId,
          timeSec,
          timestamp: Date.now(),
          conditions: opts?.conditions ?? ['Dry'],
          note: opts?.note,
          selfReported: true,
        }

        const feedItem: FeedItem | undefined = isPb
          ? {
              id: uid('f'),
              type: 'pb',
              userId: CURRENT_USER_ID,
              trailId,
              text: `New PB — crushed it.`,
              timestamp: Date.now(),
              kudos: [],
            }
          : {
              id: uid('f'),
              type: 'hike',
              userId: CURRENT_USER_ID,
              trailId,
              text: `Logged a hike. Back at it.`,
              timestamp: Date.now(),
              kudos: [],
            }

        const allAfter = { ...allBefore, [CURRENT_USER_ID]: Math.min(allBefore[CURRENT_USER_ID] ?? Infinity, timeSec) }
        const sortedAfter = Object.entries(allAfter).sort((a, b) => a[1] - b[1])
        const rankAfter = sortedAfter.findIndex(([id]) => id === CURRENT_USER_ID) + 1

        const result: LastResult = {
          trailId,
          timeSec,
          previousBest,
          isPb,
          chase: rec.chase,
          deltaToChase: rec.chase ? timeSec - rec.chase.timeSec : undefined,
          rankBefore: rankBefore || undefined,
          rankAfter,
        }

        set((s) => ({
          runs: [run, ...s.runs],
          feed: feedItem ? [feedItem, ...s.feed] : s.feed,
          recording: undefined,
          lastResult: result,
          chase: rec.chase?.trailId === trailId && isPb && rec.chase.timeSec > timeSec
            ? undefined
            : s.chase,
        }))

        return result
      },

      clearResult: () => set({ lastResult: undefined }),

      createCrew: (name, region, inviteIds) => {
        const id = uid('c')
        const crew: Crew = {
          id,
          name: name.trim(),
          region: region.trim() || 'Bow Valley',
          members: [CURRENT_USER_ID, ...inviteIds.filter((m) => m !== CURRENT_USER_ID)],
          challenge: 'First month on the dirt',
          challengeProgress: 0,
          challengeGoal: 5000,
          challengeUnit: 'm',
        }
        set((s) => ({
          crews: [crew, ...s.crews],
          joinedCrewIds: [id, ...s.joinedCrewIds],
        }))
      },

      createOuting: (crewId, plan) =>
        set((s) => ({
          crews: s.crews.map((c) =>
            c.id === crewId
              ? { ...c, outing: { ...plan, going: [CURRENT_USER_ID] } }
              : c,
          ),
          feed: [
            {
              id: uid('f'),
              type: 'outing' as const,
              userId: CURRENT_USER_ID,
              trailId: plan.trailId,
              crewId,
              text: `${plan.when} · ${plan.pace} · meet at ${plan.meet}`,
              timestamp: Date.now(),
              kudos: [],
              comments: [],
            },
            ...s.feed,
          ],
        })),

      addComment: (feedId, text) =>
        set((s) => ({
          feed: s.feed.map((f) =>
            f.id === feedId
              ? {
                  ...f,
                  comments: [
                    ...(f.comments ?? []),
                    { id: uid('cm'), userId: CURRENT_USER_ID, text: text.trim(), timestamp: Date.now() },
                  ],
                }
              : f,
          ),
        })),

      packTrail: (trailId) =>
        set((s) => ({
          packedTrailIds: s.packedTrailIds.includes(trailId)
            ? s.packedTrailIds
            : [...s.packedTrailIds, trailId],
        })),

      finishOnboarding: (knownTrailIds) =>
        set((s) => ({
          onboarded: true,
          savedTrailIds: [...new Set([...s.savedTrailIds, ...knownTrailIds])],
        })),

      logManualRun: (trailId, timeSec, conditions) => {
        const run: Run = {
          id: uid('r'),
          userId: CURRENT_USER_ID,
          trailId,
          timeSec,
          timestamp: Date.now(),
          conditions,
          selfReported: true,
        }
        set((s) => ({ runs: [run, ...s.runs] }))
      },
    }),
    {
      name: 'switchback-v1.3',
      partialize: (s) => ({
        runs: s.runs,
        reviews: s.reviews,
        conditions: s.conditions,
        feed: s.feed,
        crews: s.crews,
        joinedCrewIds: s.joinedCrewIds,
        savedTrailIds: s.savedTrailIds,
        packedTrailIds: s.packedTrailIds,
        onboarded: s.onboarded,
        chase: s.chase,
        ageBracket: s.ageBracket,
        experience: s.experience,
        displayName: s.displayName,
      }),
    },
  ),
)

export function bestTime(runs: Run[], userId: string, trailId: string): number | undefined {
  const times = runs.filter((r) => r.userId === userId && r.trailId === trailId).map((r) => r.timeSec)
  return times.length ? Math.min(...times) : undefined
}

export function leaderboard(
  runs: Run[],
  trailId: string,
  filter?: (userId: string) => boolean,
): { userId: string; timeSec: number; improved?: number }[] {
  const best = new Map<string, { timeSec: number; times: number[] }>()
  for (const r of runs.filter((x) => x.trailId === trailId)) {
    if (filter && !filter(r.userId)) continue
    const cur = best.get(r.userId) ?? { timeSec: Infinity, times: [] }
    cur.times.push(r.timeSec)
    cur.timeSec = Math.min(cur.timeSec, r.timeSec)
    best.set(r.userId, cur)
  }
  return [...best.entries()]
    .map(([userId, v]) => {
      const sorted = [...v.times].sort((a, b) => b - a)
      const improved = sorted.length > 1 ? sorted[0] - v.timeSec : 0
      return { userId, timeSec: v.timeSec, improved }
    })
    .sort((a, b) => a.timeSec - b.timeSec)
}
