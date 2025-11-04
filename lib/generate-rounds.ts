import type { IFilm, IRound } from "./models/Combat"

export function generateRounds(movies: IFilm[]): IRound[] {
  const rounds: IRound[] = []
  const shuffled = [...movies].sort(() => Math.random() - 0.5)

  for (let i = 0; i < shuffled.length; i += 2) {
    if (shuffled[i + 1]) {
      rounds.push({
        filmA: shuffled[i],
        filmB: shuffled[i + 1],
        votes: new Map(),
        finished: false,
      })
    }
  }

  return rounds
}
