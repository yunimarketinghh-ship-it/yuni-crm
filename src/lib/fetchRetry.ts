// Lädt Daten mit bis zu 3 Versuchen. Bei Fehler (z. B. wackelige Verbindung) wird NICHT mit
// einer leeren Liste überschrieben – der Aufrufer behält die alten Daten, statt alles auf 0 zu setzen.
export async function withRetry<T>(
  run: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  tries = 3,
): Promise<{ data: T | null; error: { message: string } | null }> {
  let last: { data: T | null; error: { message: string } | null } = { data: null, error: { message: 'Unbekannter Fehler' } }
  for (let i = 0; i < tries; i++) {
    try {
      last = await run()
      if (!last.error && last.data) return last
    } catch (e) {
      last = { data: null, error: { message: e instanceof Error ? e.message : String(e) } }
    }
    await new Promise(r => setTimeout(r, 800 * (i + 1)))
  }
  return last
}
