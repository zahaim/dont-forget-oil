import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { CURRENCIES } from '@/constants/currencies';

// ---------------------------------------------------------------------------
// Core OCR
// ---------------------------------------------------------------------------

const MIN_CONFIDENCE = 0.4;

async function recognize(imageUri: string): Promise<TextRecognitionResult> {
  return TextRecognition.recognize(imageUri);
}

/** Extract lines, optionally filtering by element confidence. */
function rawLines(result: TextRecognitionResult): string[] {
  const lines: string[] = [];
  for (const block of result.blocks) {
    for (const line of block.lines) {
      lines.push(line.text);
    }
  }
  return lines;
}

/** Extract lines keeping only elements above confidence threshold. */
function confidentLines(result: TextRecognitionResult): string[] {
  const lines: string[] = [];
  for (const block of result.blocks) {
    for (const line of block.lines) {
      const goodElements = line.elements.filter((el) => {
        const conf = (el as unknown as { confidence?: number }).confidence;
        return conf == null || conf >= MIN_CONFIDENCE;
      });
      if (goodElements.length > 0) {
        lines.push(goodElements.map((el) => el.text).join(' '));
      }
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Normalization — aggressively coerce letters to digits for number contexts
// ---------------------------------------------------------------------------

/** Map commonly-confused letters to digits. */
const LETTER_TO_DIGIT: Record<string, string> = {
  O: '0', o: '0',
  I: '1', l: '1', i: '1',
  Z: '2', z: '2',
  S: '5', s: '5',
  G: '6',
  T: '7',
  B: '8',
  g: '9', q: '9',
};

/**
 * Convert a string to digits-only, replacing ambiguous letters with their
 * digit equivalents. Used when we expect the text to be a number.
 */
function toDigits(text: string): string {
  return text
    .split('')
    .map((ch) => {
      if (/\d/.test(ch)) return ch;
      if (ch === '.' || ch === ',') return ch;
      return LETTER_TO_DIGIT[ch] ?? '';
    })
    .join('');
}

function normalize(text: string): string {
  // First pass: swap common letter→digit misreads
  let out = toDigits(text);
  // Collapse whitespace between digits: "12 345" → "12345"
  out = out.replace(/(\d)\s+(?=\d)/g, '$1');
  // Remove thousands separators: "1.234" or "1,234" when followed by 3 digits
  out = out.replace(/[.,](?=\d{3}(?!\d))/g, '');
  // Standardize decimal separator to period
  out = out.replace(',', '.');
  return out;
}

/**
 * Lighter normalization that preserves letters (for pattern matching with
 * unit/currency labels).
 */
function normalizeSoft(text: string): string {
  return text
    .replace(/(\d)\s+(?=\d)/g, '$1')
    .replace(/[.,](?=\d{3}(?!\d))/g, '')
    .replace(',', '.');
}

// ---------------------------------------------------------------------------
// Volume markers: L, l, dm3, dm³, litr, litres, liters, gal, gallon(s)
// ---------------------------------------------------------------------------
const VOLUME_PATTERN = /(\d+[.,]?\d*)\s*(?:dm[³3]|l(?:itr?(?:es?|ów|y)?)?|gal(?:lons?)?)\b/gi;

// ---------------------------------------------------------------------------
// Currency markers: build from app's CURRENCIES list + common OCR misreads
// ---------------------------------------------------------------------------
function buildCurrencyPattern(): RegExp {
  const tokens: string[] = [];
  for (const c of CURRENCIES) {
    tokens.push(escapeRegex(c.code));
    tokens.push(escapeRegex(c.symbol));
  }
  tokens.push('zl', 'zt', 'zI');
  tokens.sort((a, b) => b.length - a.length);
  const joined = tokens.join('|');
  return new RegExp(
    `(?:(\\d+[.,]?\\d*)\\s*(?:${joined}))` +
    `|(?:(?:${joined})\\s*(\\d+[.,]?\\d*))`,
    'gi',
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const CURRENCY_PATTERN = buildCurrencyPattern();

// ---------------------------------------------------------------------------
// Mileage (odometer)
// ---------------------------------------------------------------------------

export interface MileageResult {
  /** Best candidate (or null). */
  value: number | null;
  /** All plausible candidates sorted best-first. */
  candidates: number[];
  rawText: string[];
}

export async function extractMileage(
  imageUri: string,
  lastMileage?: number | null,
): Promise<MileageResult> {
  const result = await recognize(imageUri);
  const allLines = rawLines(result);
  const filteredLines = confidentLines(result);

  const candidateSet = new Set<number>();

  // Try confident lines first, then fall back to all lines
  for (const lines of [filteredLines, allLines]) {
    for (const line of lines) {
      const norm = normalize(line);
      const matches = norm.match(/\d+(?:\.\d+)?/g);
      if (matches) {
        for (const m of matches) {
          const num = parseFloat(m);
          if (num >= 100 && num <= 9_999_999) {
            candidateSet.add(Math.round(num));
          }
        }
      }
    }
  }

  const candidates = Array.from(candidateSet);

  if (candidates.length === 0) {
    return { value: null, candidates: [], rawText: allLines };
  }

  // Score candidates: prefer values close to (but >= ) lastMileage
  if (lastMileage != null && lastMileage > 0) {
    candidates.sort((a, b) => {
      const aOk = a >= lastMileage;
      const bOk = b >= lastMileage;
      // Both plausible — prefer closer to lastMileage
      if (aOk && bOk) return a - b;
      // Prefer plausible over implausible
      if (aOk !== bOk) return aOk ? -1 : 1;
      // Both implausible — prefer larger
      return b - a;
    });
  } else {
    // No prior reading — largest first
    candidates.sort((a, b) => b - a);
  }

  return { value: candidates[0], candidates, rawText: allLines };
}

// ---------------------------------------------------------------------------
// Pump reading
// ---------------------------------------------------------------------------

export interface PumpResult {
  fuelAmount: number | null;
  cost: number | null;
  pricePerUnit: number | null;
  /** All distinct number candidates found, for user selection. */
  allCandidates: number[];
  rawText: string[];
}

export async function extractPumpReading(imageUri: string): Promise<PumpResult> {
  const result = await recognize(imageUri);
  const allLines = rawLines(result);
  const filteredLines = confidentLines(result);

  const volumeCandidates: number[] = [];
  const costCandidates: number[] = [];
  const allNumbers: number[] = [];

  // Process both confident and all lines
  for (const lines of [filteredLines, allLines]) {
    for (const line of lines) {
      // Soft normalize keeps letters for unit/currency matching
      const text = normalizeSoft(line);

      let m: RegExpExecArray | null;
      VOLUME_PATTERN.lastIndex = 0;
      while ((m = VOLUME_PATTERN.exec(text)) !== null) {
        const num = parseFloat(m[1]);
        if (num > 0 && num < 10000) {
          volumeCandidates.push(num);
        }
      }

      CURRENCY_PATTERN.lastIndex = 0;
      while ((m = CURRENCY_PATTERN.exec(text)) !== null) {
        const numStr = m[1] || m[2];
        if (numStr) {
          const num = parseFloat(numStr);
          if (num > 0 && num < 100000) {
            costCandidates.push(num);
          }
        }
      }

      // Also extract all bare numbers (digit-coerced)
      const norm = normalize(line);
      const numMatches = norm.match(/\d+\.\d+|\d{2,}/g);
      if (numMatches) {
        for (const nm of numMatches) {
          const num = parseFloat(nm);
          if (num > 0 && num < 100000) {
            allNumbers.push(num);
          }
        }
      }
    }
  }

  const dedup = (arr: number[]) =>
    arr.filter((v, i, a) => a.findIndex((u) => Math.abs(u - v) < 0.001) === i);

  const volumes = dedup(volumeCandidates);
  const costs = dedup(costCandidates).sort((a, b) => a - b);
  const uniqueAll = dedup(allNumbers).sort((a, b) => a - b);

  let fuelAmount: number | null = null;
  let cost: number | null = null;
  let pricePerUnit: number | null = null;

  if (volumes.length > 0) {
    volumes.sort((a, b) => b - a);
    fuelAmount = volumes[0];
  }

  if (costs.length >= 2) {
    cost = costs[costs.length - 1];
    pricePerUnit = costs[0];
    if (pricePerUnit > 20) pricePerUnit = null;
  } else if (costs.length === 1) {
    cost = costs[0];
  }

  // Fallback: value-based heuristic
  if (fuelAmount === null || cost === null) {
    if (fuelAmount === null && cost === null && uniqueAll.length >= 2) {
      if (uniqueAll.length >= 3) {
        fuelAmount = uniqueAll[1];
        cost = uniqueAll[uniqueAll.length - 1];
        pricePerUnit = uniqueAll[0] <= 20 ? uniqueAll[0] : null;
      } else {
        fuelAmount = uniqueAll[0];
        cost = uniqueAll[1];
      }
    } else if (fuelAmount === null && uniqueAll.length >= 1) {
      for (const n of uniqueAll) {
        if (cost !== null && Math.abs(n - cost) > 0.001 && n < cost) {
          fuelAmount = n;
          break;
        }
      }
    } else if (cost === null && uniqueAll.length >= 1) {
      for (let i = uniqueAll.length - 1; i >= 0; i--) {
        if (fuelAmount !== null && Math.abs(uniqueAll[i] - fuelAmount) > 0.001) {
          cost = uniqueAll[i];
          break;
        }
      }
    }
  }

  return { fuelAmount, cost, pricePerUnit, allCandidates: uniqueAll, rawText: allLines };
}
