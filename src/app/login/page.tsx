"use client";

import { AppShell, Eyebrow } from "@/components/votetrue/DesignPrimitives";
import {
  createGuestUser,
  decodeGoogleCredential,
  storeUser,
} from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type GoogleAccounts = {
  id: {
    initialize: (config: {
      callback: (response: { credential?: string }) => void;
      client_id: string;
    }) => void;
    renderButton: (
      element: HTMLElement,
      options: { shape: string; size: string; text: string; theme: string; width: number },
    ) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: GoogleAccounts;
    };
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <AppShell active="login">
      <div className="page">
        <section className="container" style={{ padding: "72px 28px 96px" }}>
          <div className="card" style={{ margin: "0 auto", maxWidth: 520, padding: 36 }}>
            <Eyebrow>VoteTrue account</Eyebrow>
            <h1 style={{ fontSize: 34, marginTop: 16 }}>Loading sign-in...</h1>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function LoginContent() {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  const nextPath = searchParams.get("next") || "/verify";

  useEffect(() => {
    if (!googleClientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (!response.credential) {
            setError("Google sign-in did not return a valid credential.");
            return;
          }
          try {
            storeUser(decodeGoogleCredential(response.credential));
            router.push(nextPath);
          } catch {
            setError("We could not read the Google sign-in response.");
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        shape: "rectangular",
        size: "large",
        text: "continue_with",
        theme: "outline",
        width: 320,
      });
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [nextPath, router]);

  function continueAsGuest() {
    storeUser(createGuestUser());
    router.push(nextPath);
  }

  return (
    <AppShell active="login">
      <div className="page">
        <section className="container" style={{ padding: "72px 28px 96px" }}>
          <div
            className="card"
            style={{
              display: "grid",
              gap: 0,
              gridTemplateColumns: "1fr 1fr",
              margin: "0 auto",
              maxWidth: 920,
              overflow: "hidden",
            }}
          >
            <div style={{ borderRight: "1px solid var(--rule)", padding: 36 }}>
              <Eyebrow>VoteTrue account</Eyebrow>
              <h1 style={{ fontSize: 38, letterSpacing: "-0.018em", marginTop: 16 }}>
                Sign in only if you want.
              </h1>
              <p style={{ color: "var(--ink-2)", fontSize: 15, marginTop: 14 }}>
                You can verify forwards as a guest. Google sign-in is optional and only used for
                future saved history or power-user features.
              </p>
              <div style={{ display: "grid", gap: 14, marginTop: 28 }}>
                {googleClientId ? (
                  <div aria-label="Continue with Google" ref={buttonRef} />
                ) : (
                  <div className="auth-note" role="status">
                    Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
                  </div>
                )}
                <button className="btn civic" onClick={continueAsGuest} type="button">
                  Continue as Guest <span className="arrow">-&gt;</span>
                </button>
              </div>
              {error ? (
                <p role="alert" style={{ color: "var(--warn-ink)", fontSize: 13, marginTop: 16 }}>
                  {error}
                </p>
              ) : null}
            </div>
            <div style={{ background: "var(--paper-2)", padding: 36 }}>
              <Eyebrow>Privacy stance</Eyebrow>
              <div style={{ display: "grid", gap: 18, marginTop: 20 }}>
                {[
                  ["No party profiling", "VoteTrue never asks who you support."],
                  ["Guest-first access", "A voter can verify a forward without Google sign-in."],
                  ["Optional Google sign-in", "Google is only for future saved history and power-user features."],
                  ["Source-backed results", "Login does not change verdicts or confidence."],
                ].map(([title, body]) => (
                  <div key={title} style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 16 }}>
                    <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 15 }}>{title}</h2>
                    <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: 5 }}>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
