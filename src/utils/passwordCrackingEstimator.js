/**
 * Simple Password Cracking Time Estimator (College Project Edition)
 * 
 * Estimates approximate brute-force cracking time locally in the browser.
 * Formula: Combinations = (Pool Size) ^ (Password Length)
 * Average Time = Combinations / (1 Billion guesses per second)
 * 
 * 100% Client-Side. Never sends or stores the password.
 */

const COMMON_PATTERNS = ['123456', 'qwerty', 'password', 'admin', 'abcdef', '1111', '0000'];

export function estimateCrackTime(password, isCommon = false) {
  if (!password) {
    return {
      timeText: '—',
      color: 'text-text-muted',
      patternWarning: null,
    };
  }

  // 1. Check for common dictionary password
  if (isCommon) {
    return {
      timeText: 'Instantly',
      color: 'text-danger',
      patternWarning: 'This password is in common password lists and can be cracked in less than a second.',
    };
  }

  // 2. Simple pattern detection
  let patternWarning = null;
  const lower = password.toLowerCase();

  if (/(.)\1{2,}/.test(password)) {
    patternWarning = 'Repeating characters (like "aaa") make passwords much easier to guess.';
  } else if (COMMON_PATTERNS.some((p) => lower.includes(p))) {
    patternWarning = 'Contains predictable sequences (like "123456" or "qwerty").';
  }

  // 3. Calculate character pool size
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;

  if (pool === 0) pool = 1;

  // 4. Calculate total combinations: pool ^ length
  // We use Math.pow with safety limit or logarithms to avoid Infinity
  const len = password.length;
  const logCombinations = len * Math.log10(pool);

  // Modern GPU can test approx 1 billion (10^9) guesses per second
  const logGuessesPerSec = 9; 
  const logSeconds = logCombinations - logGuessesPerSec;

  // Convert to human-friendly text
  let timeText;
  let color;

  if (logSeconds < 0) {
    timeText = 'Instantly (< 1 sec)';
    color = 'text-danger';
  } else if (logSeconds < 1.77) {
    // Up to 60 seconds
    const sec = Math.round(Math.pow(10, logSeconds));
    timeText = `${sec} second${sec === 1 ? '' : 's'}`;
    color = 'text-danger';
  } else if (logSeconds < 3.55) {
    // Up to 60 minutes
    const min = Math.round(Math.pow(10, logSeconds) / 60);
    timeText = `${min} minute${min === 1 ? '' : 's'}`;
    color = 'text-warning';
  } else if (logSeconds < 4.93) {
    // Up to 24 hours
    const hr = Math.round(Math.pow(10, logSeconds) / 3600);
    timeText = `${hr} hour${hr === 1 ? '' : 's'}`;
    color = 'text-warning';
  } else if (logSeconds < 6.41) {
    // Up to 30 days
    const days = Math.round(Math.pow(10, logSeconds) / 86400);
    timeText = `${days} day${days === 1 ? '' : 's'}`;
    color = 'text-warning';
  } else if (logSeconds < 7.5) {
    // Up to 1 year
    const months = Math.round(Math.pow(10, logSeconds) / (86400 * 30));
    timeText = `${months} month${months === 1 ? '' : 's'}`;
    color = 'text-accent';
  } else if (logSeconds < 10) {
    // Up to 1000 years
    const yrs = Math.round(Math.pow(10, logSeconds) / (86400 * 365));
    timeText = `${yrs.toLocaleString()} years`;
    color = 'text-success';
  } else {
    timeText = 'Millions of years';
    color = 'text-success';
  }

  return {
    timeText,
    color,
    patternWarning,
  };
}
