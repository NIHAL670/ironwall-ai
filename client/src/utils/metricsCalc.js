/**
 * Real evaluation metrics and operational analytics for voice deepfake detection.
 * All calculations are stateless and derived from actual ML model outputs.
 */

// ── Supervised Benchmark Metrics (Strictly requires Ground Truth) ──

/**
 * Filter items that possess real ground-truth labels ('ai' or 'human').
 * We NEVER simulate or fall back to model predictions as ground truth.
 */
export function getLabeledItems(items) {
  return (items || []).filter(
    (item) => item.groundTruth === 'ai' || item.groundTruth === 'human'
  )
}

/**
 * Compute confusion matrix ONLY on items with explicit ground-truth labels.
 * Returns null if no labeled items exist.
 */
export function computeConfusionMatrix(items) {
  const labeled = getLabeledItems(items)
  if (!labeled.length) {
    return { tp: 0, tn: 0, fp: 0, fn: 0, total: 0, hasLabels: false }
  }

  let tp = 0, tn = 0, fp = 0, fn = 0
  for (const item of labeled) {
    const predicted = isAiClassification(item.classification)
    const actual = item.groundTruth === 'ai'

    if (actual && predicted) tp++
    else if (!actual && !predicted) tn++
    else if (!actual && predicted) fp++
    else fn++
  }

  return { tp, tn, fp, fn, total: labeled.length, hasLabels: true }
}

/**
 * Compute confusion matrix based on a custom score threshold on labeled items.
 */
export function computeConfusionMatrixByScore(items, threshold = 0.58) {
  const labeled = getLabeledItems(items)
  if (!labeled.length) {
    return { tp: 0, tn: 0, fp: 0, fn: 0, total: 0, hasLabels: false }
  }

  let tp = 0, tn = 0, fp = 0, fn = 0
  for (const item of labeled) {
    const rawScore = Number(item.score ?? item.confidenceScore) || 0
    const predicted = rawScore >= threshold
    const actual = item.groundTruth === 'ai'

    if (actual && predicted) tp++
    else if (!actual && !predicted) tn++
    else if (!actual && predicted) fp++
    else fn++
  }

  return { tp, tn, fp, fn, total: labeled.length, hasLabels: true }
}

export const computePrecision = (cm) => {
  if (!cm || !cm.hasLabels || cm.tp + cm.fp === 0) return null
  return cm.tp / (cm.tp + cm.fp)
}

export const computeRecall = (cm) => {
  if (!cm || !cm.hasLabels || cm.tp + cm.fn === 0) return null
  return cm.tp / (cm.tp + cm.fn)
}

export const computeSpecificity = (cm) => {
  if (!cm || !cm.hasLabels || cm.tn + cm.fp === 0) return null
  return cm.tn / (cm.tn + cm.fp)
}

export const computeAccuracy = (cm) => {
  if (!cm || !cm.hasLabels || cm.total === 0) return null
  return (cm.tp + cm.tn) / cm.total
}

export const computeF1 = (cm) => {
  const p = computePrecision(cm)
  const r = computeRecall(cm)
  if (p === null || r === null || p + r === 0) return null
  return (2 * p * r) / (p + r)
}

/**
 * Compute ROC curve strictly on labeled samples with both AI and Human representations.
 */
export function computeROCCurve(items, steps = 100) {
  const labeled = getLabeledItems(items)
  const hasAi = labeled.some((x) => x.groundTruth === 'ai')
  const hasHuman = labeled.some((x) => x.groundTruth === 'human')

  if (!hasAi || !hasHuman) return []

  const curve = []
  for (let i = 0; i <= steps; i++) {
    const th = i / steps
    const cm = computeConfusionMatrixByScore(labeled, th)
    const tpr = cm.tp + cm.fn === 0 ? 0 : cm.tp / (cm.tp + cm.fn)
    const fpr = cm.fp + cm.tn === 0 ? 0 : cm.fp / (cm.fp + cm.tn)
    curve.push({ threshold: th, fpr, tpr })
  }
  return curve.sort((a, b) => a.fpr - b.fpr)
}

export function computeAUC(rocCurve) {
  if (!rocCurve || rocCurve.length < 2) return null
  const sorted = [...rocCurve].sort((a, b) => a.fpr - b.fpr)
  let auc = 0
  for (let i = 1; i < sorted.length; i++) {
    const dx = sorted[i].fpr - sorted[i - 1].fpr
    const avgY = (sorted[i].tpr + sorted[i - 1].tpr) / 2
    auc += dx * avgY
  }
  return Math.max(0, Math.min(1, auc))
}

export function computeEER(items, steps = 200) {
  const labeled = getLabeledItems(items)
  const hasAi = labeled.some((x) => x.groundTruth === 'ai')
  const hasHuman = labeled.some((x) => x.groundTruth === 'human')
  if (!hasAi || !hasHuman) return { eer: null, eerThreshold: null }

  let bestDiff = Infinity, eer = 0, eerTh = 0.58
  for (let i = 0; i <= steps; i++) {
    const th = i / steps
    const cm = computeConfusionMatrixByScore(labeled, th)
    const far = cm.fp + cm.tn === 0 ? 0 : cm.fp / (cm.fp + cm.tn)
    const frr = cm.fn + cm.tp === 0 ? 0 : cm.fn / (cm.fn + cm.tp)
    const diff = Math.abs(far - frr)
    if (diff < bestDiff) {
      bestDiff = diff
      eer = (far + frr) / 2
      eerTh = th
    }
  }
  return { eer, eerThreshold: eerTh }
}

export function computeDETCurve(items, steps = 100) {
  const labeled = getLabeledItems(items)
  const hasAi = labeled.some((x) => x.groundTruth === 'ai')
  const hasHuman = labeled.some((x) => x.groundTruth === 'human')
  if (!hasAi || !hasHuman) return []

  const curve = []
  for (let i = 0; i <= steps; i++) {
    const th = i / steps
    const cm = computeConfusionMatrixByScore(labeled, th)
    const fpr = cm.fp + cm.tn === 0 ? 0 : cm.fp / (cm.fp + cm.tn)
    const fnr = cm.fn + cm.tp === 0 ? 0 : cm.fn / (cm.fn + cm.tp)
    curve.push({ threshold: th, fpr, fnr })
  }
  return curve
}

// ── Live Working Model Analytics (Directly from Real Model Outputs) ──

/**
 * Computes live operational statistics from all scanned items.
 * 100% real: requires no ground truth labels.
 */
export function computeLiveModelStats(items) {
  if (!items || !items.length) {
    return {
      total: 0,
      aiCount: 0,
      humanCount: 0,
      aiRate: 0,
      meanScore: 0,
      medianScore: 0,
      minScore: 0,
      maxScore: 0,
      scoreStdDev: 0,
      avgConfidence: 0,
      avgAiConfidence: 0,
      avgHumanConfidence: 0,
      avgAiRatio: 0,
      avgStrongRatio: 0,
      avgMaxRunRatio: 0,
      borderlineCount: 0,
      borderlineRate: 0,
    }
  }

  const n = items.length
  const aiItems = items.filter((x) => isAiClassification(x.classification))
  const humanItems = items.filter((x) => !isAiClassification(x.classification))

  const scores = items.map((x) => Number(x.score ?? x.confidenceScore) || 0)
  const sortedScores = [...scores].sort((a, b) => a - b)
  const meanScore = scores.reduce((s, v) => s + v, 0) / n
  const variance = scores.reduce((s, v) => s + (v - meanScore) ** 2, 0) / n

  const medianScore =
    n % 2 === 0
      ? (sortedScores[n / 2 - 1] + sortedScores[n / 2]) / 2
      : sortedScores[Math.floor(n / 2)]

  const confidences = items.map((x) => Number(x.confidenceScore) || 0)
  const avgConfidence = confidences.reduce((s, v) => s + v, 0) / n

  const aiConf = aiItems.map((x) => Number(x.confidenceScore) || 0)
  const avgAiConfidence = aiConf.length ? aiConf.reduce((s, v) => s + v, 0) / aiConf.length : 0

  const humanConf = humanItems.map((x) => Number(x.confidenceScore) || 0)
  const avgHumanConfidence = humanConf.length
    ? humanConf.reduce((s, v) => s + v, 0) / humanConf.length
    : 0

  // Segment telemetry
  const aiRatios = items.map((x) => Number(x.aiRatio) || 0)
  const strongRatios = items.map((x) => Number(x.strongRatio) || 0)
  const runRatios = items.map((x) => Number(x.maxRunRatio) || 0)

  const avgAiRatio = aiRatios.reduce((s, v) => s + v, 0) / n
  const avgStrongRatio = strongRatios.reduce((s, v) => s + v, 0) / n
  const avgMaxRunRatio = runRatios.reduce((s, v) => s + v, 0) / n

  // Borderline count (samples within ±0.08 of default threshold 0.58)
  const borderlineCount = scores.filter((s) => s >= 0.50 && s <= 0.66).length

  return {
    total: n,
    aiCount: aiItems.length,
    humanCount: humanItems.length,
    aiRate: (aiItems.length / n) * 100,
    meanScore: meanScore * 100,
    medianScore: medianScore * 100,
    minScore: sortedScores[0] * 100,
    maxScore: sortedScores[n - 1] * 100,
    scoreStdDev: Math.sqrt(variance) * 100,
    avgConfidence: avgConfidence * 100,
    avgAiConfidence: avgAiConfidence * 100,
    avgHumanConfidence: avgHumanConfidence * 100,
    avgAiRatio: avgAiRatio * 100,
    avgStrongRatio: avgStrongRatio * 100,
    avgMaxRunRatio: avgMaxRunRatio * 100,
    borderlineCount,
    borderlineRate: (borderlineCount / n) * 100,
  }
}

/**
 * Real score distribution across all scans.
 */
export function computeScoreDistribution(items, bins = 10) {
  if (!items || !items.length) return []
  const ai = new Array(bins).fill(0)
  const human = new Array(bins).fill(0)
  const binWidth = 1 / bins

  for (const item of items) {
    const score = Number(item.score ?? item.confidenceScore) || 0
    const idx = Math.min(bins - 1, Math.floor(score / binWidth))
    if (isAiClassification(item.classification)) ai[idx]++
    else human[idx]++
  }

  return Array.from({ length: bins }, (_, i) => ({
    bin: `${Math.round(i * binWidth * 100)}-${Math.round((i + 1) * binWidth * 100)}%`,
    ai: ai[i],
    human: human[i],
    total: ai[i] + human[i],
  }))
}

/**
 * Operational threshold sensitivity analysis.
 * Computes how varying the decision threshold alters flagged volume and ambiguity.
 */
export function computeThresholdSensitivity(items, currentThreshold = 0.58, steps = 20) {
  if (!items || !items.length) return { curve: [], current: null }

  const total = items.length
  const curve = []

  for (let i = 0; i <= steps; i++) {
    const th = 0.1 + (i / steps) * 0.8 // 0.1 to 0.9
    let flaggedAi = 0
    let ambiguous = 0

    for (const item of items) {
      const s = Number(item.score ?? item.confidenceScore) || 0
      if (s >= th) flaggedAi++
      if (Math.abs(s - th) <= 0.08) ambiguous++
    }

    curve.push({
      threshold: Math.round(th * 100),
      aiRate: Math.round((flaggedAi / total) * 1000) / 10,
      humanRate: Math.round(((total - flaggedAi) / total) * 1000) / 10,
      ambiguousRate: Math.round((ambiguous / total) * 1000) / 10,
    })
  }

  // Current threshold point
  let flaggedNow = 0
  let ambiguousNow = 0
  for (const item of items) {
    const s = Number(item.score ?? item.confidenceScore) || 0
    if (s >= currentThreshold) flaggedNow++
    if (Math.abs(s - currentThreshold) <= 0.08) ambiguousNow++
  }

  const current = {
    threshold: Math.round(currentThreshold * 100),
    flaggedAi: flaggedNow,
    flaggedAiRate: Math.round((flaggedNow / total) * 1000) / 10,
    ambiguous: ambiguousNow,
    ambiguousRate: Math.round((ambiguousNow / total) * 1000) / 10,
  }

  return { curve, current }
}

/**
 * Language breakdown from real scans.
 */
export function computeLanguageBreakdown(items) {
  if (!items || !items.length) return []
  const map = {}
  for (const item of items) {
    const lang = item.language || 'Unknown'
    if (!map[lang]) {
      map[lang] = { language: lang, count: 0, ai: 0, human: 0, confSum: 0 }
    }
    map[lang].count++
    const isAi = isAiClassification(item.classification)
    if (isAi) map[lang].ai++
    else map[lang].human++
    map[lang].confSum += Number(item.confidenceScore) || 0
  }

  return Object.values(map).map((v) => ({
    ...v,
    aiRate: Math.round((v.ai / v.count) * 100),
    avgConfidence: Math.round((v.confSum / v.count) * 100),
  }))
}

/**
 * Score timeline for the latest scans.
 */
export function computeScoreTimeline(items, limit = 20) {
  if (!items || !items.length) return []
  return [...items]
    .slice(0, limit)
    .reverse()
    .map((x, i) => ({
      scan: `#${i + 1}`,
      fileName: x.fileName || `Scan #${i + 1}`,
      score: Math.round((Number(x.score ?? x.confidenceScore) || 0) * 100),
      threshold: Math.round((Number(x.threshold) || 0.58) * 100),
      confidence: Math.round((Number(x.confidenceScore) || 0) * 100),
      isAi: isAiClassification(x.classification),
    }))
}

// ── Live Audio Monitoring Stats (Continuous Live Stream) ─────────────
export function computeLiveStats(scored) {
  if (!scored || !scored.length) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 }
  }

  const vals = scored.map((p) => p.ai)
  const sorted = [...vals].sort((a, b) => a - b)
  const n = vals.length
  const mean = vals.reduce((s, v) => s + v, 0) / n
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean: Math.round(mean * 10) / 10,
    median:
      n % 2 === 0
        ? Math.round(((sorted[n / 2 - 1] + sorted[n / 2]) / 2) * 10) / 10
        : sorted[Math.floor(n / 2)],
    stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
  }
}

export function computeLiveDistribution(scored, bins = 10) {
  if (!scored || !scored.length) return []
  const counts = new Array(bins).fill(0)
  for (const p of scored) {
    const idx = Math.min(bins - 1, Math.floor(p.ai / (100 / bins)))
    counts[idx]++
  }
  return counts.map((count, i) => ({
    bin: `${i * (100 / bins)}-${(i + 1) * (100 / bins)}%`,
    count,
  }))
}

// ── Helpers ──────────────────────────────────────────────────────────
export function isAiClassification(classification) {
  return String(classification || '').toUpperCase().includes('AI')
}
