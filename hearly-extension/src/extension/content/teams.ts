import { initPlatform, injectHearlyBanner, watchUrlChanges } from './shared';
import { logger } from '../../utils/logger';

const PLATFORM = 'teams';

function isTeamsDomain(): boolean {
  const url = window.location.href;
  return url.includes('teams.microsoft.com') || url.includes('teams.live.com');
}

function detectMeeting(): boolean {
  const indicators = [
    '[data-tid="calling-screen"]',
    '[data-tid="meeting-composite"]',
    '[data-tid="prejoin-screen"]',
    '.ts-calling-screen',
    '[class*="calling"]',
    '[class*="meeting"]',
  ];
  return indicators.some(selector => !!document.querySelector(selector));
}

function getObserveTarget(): HTMLElement | null {
  return document.body;
}

if (isTeamsDomain()) {
  logger.log('Teams domain detected — watching for meeting...');
  initPlatform(PLATFORM, detectMeeting, getObserveTarget);

  watchUrlChanges((newUrl) => {
    logger.log('Teams URL changed:', newUrl);
    injectHearlyBanner();
  });
}
