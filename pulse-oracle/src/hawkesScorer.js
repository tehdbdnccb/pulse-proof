/**
 * hawkesScorer.js
 *
 * DROP-IN POINT: replace the body of `scoreMatch` with the real Hawkes
 * process intensity model from Torque Pulse (txODDS -> TxLINE feed).
 * Keep the function signature and return shape stable so server.js and
 * mcp-server.js never need to change.
 *
 * Expected real implementation shape:
 *   1. Pull recent match events (goals, cards, shots, corners) for `matchId`
 *      from your live event source.
 *   2. Feed the event timestamps into your fitted Hawkes intensity function
 *      lambda(t) = mu + sum(alpha * exp(-beta * (t - t_i))) for t_i < t.
 *   3. Return the current intensity plus a normalized 0-1 "momentum" score
 *      and a short human-readable label for the demo UI.
 */

// Simple in-memory stub so the endpoint is demoable before the real model
// is wired in. Deterministic-ish per matchId so demo runs look consistent.
function pseudoIntensity(matchId) {
  let seed = 0;
  for (const ch of String(matchId)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const t = Date.now() / 1000;
  const wobble = Math.sin(t / 17 + seed) * 0.5 + 0.5; // 0..1
  return wobble;
}

export async function scoreMatch(matchId) {
  if (!matchId) {
    throw new Error("matchId is required");
  }

  // TODO: replace with real Hawkes intensity calculation from Torque Pulse
  const intensity = pseudoIntensity(matchId);

  const label =
    intensity > 0.75 ? "high_pressure" :
    intensity > 0.45 ? "building" :
    "quiet";

  return {
    matchId,
    intensity: Number(intensity.toFixed(4)),
    momentum: label,
    model: "hawkes-process-v0-stub",
    generatedAt: new Date().toISOString(),
  };
}