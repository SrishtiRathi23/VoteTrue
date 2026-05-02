export type VoteTrueUser = {
  email?: string;
  mode: "google" | "guest";
  name: string;
  picture?: string;
};

export const AUTH_STORAGE_KEY = "votetrue:user";
export const AUTH_EVENT = "votetrue-auth-change";

export function readStoredUser(): VoteTrueUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VoteTrueUser;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeUser(user: VoteTrueUser): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearUser(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function createGuestUser(): VoteTrueUser {
  return {
    mode: "guest",
    name: "Guest voter",
  };
}

export function decodeGoogleCredential(credential: string): VoteTrueUser {
  const payload = credential.split(".")[1] ?? "";
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = JSON.parse(window.atob(normalized)) as {
    email?: string;
    name?: string;
    picture?: string;
  };

  return {
    email: decoded.email,
    mode: "google",
    name: decoded.name || decoded.email || "Google user",
    picture: decoded.picture,
  };
}
