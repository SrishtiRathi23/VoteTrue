"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_EVENT, clearUser, readStoredUser, VoteTrueUser } from "@/lib/auth";

export function AuthStatus() {
  const [user, setUser] = useState<VoteTrueUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(readStoredUser());
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!user) {
    return (
      <Link className="auth-link" href="/login">
        Optional sign in
      </Link>
    );
  }

  return (
    <div className="auth-status" aria-label={`Signed in as ${user.name}`}>
      <span aria-hidden="true" className="auth-avatar">
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${user.name} profile avatar`} src={user.picture} />
        ) : (
          user.name.slice(0, 1).toUpperCase()
        )}
      </span>
      <span className="auth-name">{user.mode === "guest" ? "Guest" : user.name}</span>
      <button className="auth-logout" onClick={clearUser} type="button">
        Sign out
      </button>
    </div>
  );
}
