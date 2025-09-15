export const SAGE_IMAGES = {
  analysis: "https://i.ibb.co/RT990pV/Sage-analysis.png",
  working: "https://i.ibb.co/QvT3v0X/Sage-work.png",
  sleep: "https://i.ibb.co/4ZTBpSS/Sage-sleep.png",
  active: "https://i.ibb.co/Q3vJSfj/Sage-active.png",
  heart: "https://i.ibb.co/B2yFxMs/Sage-heart.png",
  weather: "https://i.ibb.co/m5B8H8G/Sage-weather.png",
  meditation: "https://i.ibb.co/XkScD1B/Sage-meditation.png",
  music: "https://i.ibb.co/TMhvM4q/Sage-music.png",
  recovery: "https://i.ibb.co/xVfP72M/Sage-recovery.png",
  greeting: "https://i.ibb.co/gbTdSHc/Sage-hi.png",
  quickwin: "https://i.ibb.co/hJ2433X/Sage-quick-win.png",
};

export function getSageImage(imageName: keyof typeof SAGE_IMAGES): string {
  return SAGE_IMAGES[imageName] || "";
}
