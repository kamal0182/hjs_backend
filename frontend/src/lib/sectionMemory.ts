// The app navigates in memory (the URL always stays "/"). The current section
// is kept per browser tab so a refresh reopens it instead of the dashboard.
const SECTION_KEY = "hjs.section";

export function readSavedSection(): string {
  try {
    return sessionStorage.getItem(SECTION_KEY) ?? "/";
  } catch {
    return "/";
  }
}

export function saveSection(pathname: string) {
  try {
    sessionStorage.setItem(SECTION_KEY, pathname);
  } catch {
    // Storage unavailable (e.g. private mode): a refresh just lands on the dashboard.
  }
}
