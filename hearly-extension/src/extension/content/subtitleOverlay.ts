import type { TranscriptEntry } from '../../utils/types';

let subtitleRoot: HTMLDivElement | null = null;
let hideTimer: number | null = null;

function subtitleDurationMs(text: string) {
  return Math.min(9000, Math.max(5000, 5000 + text.length * 45));
}

function languageLabel(language: TranscriptEntry['language']) {
  return language.toUpperCase();
}

function injectSubtitleKeyframes() {
  if (document.getElementById('hearly-subtitle-styles')) return;
  const style = document.createElement('style');
  style.id = 'hearly-subtitle-styles';
  style.textContent = `
    @keyframes hearly-fade-in-text {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

function ensureSubtitleRoot() {
  if (subtitleRoot && document.body.contains(subtitleRoot)) {
    return subtitleRoot;
  }

  injectSubtitleKeyframes();

  subtitleRoot = document.createElement('div');
  subtitleRoot.id = 'hearly-live-subtitle';
  subtitleRoot.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: 88px;
    z-index: 2147483647;
    transform: translate(-50%, 16px) scale(0.96);
    max-width: min(760px, calc(100vw - 32px));
    min-width: min(380px, calc(100vw - 32px));
    padding: 14px 20px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: linear-gradient(135deg, rgba(16, 16, 16, 0.75) 0%, rgba(8, 8, 8, 0.90) 100%);
    color: #ffffff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 19px;
    font-weight: 600;
    line-height: 1.4;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 30px rgba(181, 240, 61, 0.02);
    backdrop-filter: blur(28px) saturate(200%);
    -webkit-backdrop-filter: blur(28px) saturate(200%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 300ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    word-break: break-word;
  `;

  document.body.appendChild(subtitleRoot);
  return subtitleRoot;
}

export function showHearlySubtitle(entry: TranscriptEntry) {
  const text = entry.text.trim();
  if (!text) return;

  const root = ensureSubtitleRoot();
  const speakerLabel = entry.speaker === 'you' ? 'MIC' : 'CALL';
  root.replaceChildren();

  const badgeRow = document.createElement('div');
  badgeRow.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;';

  const languageBadge = document.createElement('span');
  languageBadge.style.cssText = `
    border: 1px solid rgba(181, 240, 61, 0.25);
    background: rgba(181, 240, 61, 0.08);
    color: #B5F03D;
    border-radius: 999px;
    padding: 3px 9px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-shadow: 0 0 10px rgba(181, 240, 61, 0.2);
  `;
  languageBadge.textContent = languageLabel(entry.language);

  const speakerBadge = document.createElement('span');
  speakerBadge.style.cssText = `
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    border-radius: 999px;
    padding: 3px 9px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
  `;
  speakerBadge.textContent = speakerLabel;

  const textLine = document.createElement('div');
  textLine.textContent = text;
  textLine.style.cssText = `
    animation: hearly-fade-in-text 400ms ease forwards;
    background: linear-gradient(to bottom, #ffffff 0%, #e0e0e0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `;

  badgeRow.append(languageBadge, speakerBadge);
  root.append(badgeRow, textLine);

  window.requestAnimationFrame(() => {
    if (!subtitleRoot) return;
    subtitleRoot.style.opacity = '1';
    subtitleRoot.style.transform = 'translate(-50%, 0) scale(1)';
  });

  if (hideTimer !== null) {
    window.clearTimeout(hideTimer);
  }

  hideTimer = window.setTimeout(() => {
    if (!subtitleRoot) return;
    subtitleRoot.style.opacity = '0';
    subtitleRoot.style.transform = 'translate(-50%, 16px) scale(0.96)';
  }, subtitleDurationMs(text));
}
