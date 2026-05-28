"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const ACCENT = "#ffa116";
const sb = createBrowserSupabase();

export default function SettingsPage() {
  const [lcUsername, setLcUsername] = useState("");
  const [linkedLc, setLinkedLc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // Check if user is logged in and already linked
  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) {
        setChecking(false);
        return;
      }
      setLoggedIn(true);

      // Check existing link
      fetch("/api/link-status")
        .then((r) => r.json())
        .then((data) => {
          if (data.lcUsername) setLinkedLc(data.lcUsername);
        })
        .catch(() => {})
        .finally(() => setChecking(false));
    });
  }, []);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    if (!lcUsername.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/link-leetcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lcUsername: lcUsername.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setLinkedLc(data.lcUsername);
        setLcUsername("");
        setMessage({ text: `✅ Linked @${data.lcUsername}! Your building is now yours.`, ok: true });
      } else {
        setMessage({ text: `❌ ${data.error}`, ok: false });
      }
    } catch {
      setMessage({ text: "❌ Something went wrong. Please try again.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg font-pixel uppercase text-warm">
      <div className="mx-auto max-w-lg px-3 py-6 sm:px-4 sm:py-10">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted transition-colors hover:text-cream sm:mb-8"
        >
          &larr; Back to City
        </Link>

        <div className="border-[3px] border-border bg-bg-raised p-6 sm:p-10">
          <h1 className="text-center text-xl text-cream sm:text-2xl">
            <span style={{ color: ACCENT }}>Settings</span>
          </h1>

          {checking ? (
            <p className="mt-6 text-center text-sm text-muted normal-case">
              Loading...
            </p>
          ) : !loggedIn ? (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted normal-case">
                You need to sign in to link your LeetCode account.
              </p>
              <button
                onClick={() => sb.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/settings` } })}
                className="mt-4 border-[3px] border-border bg-bg-raised px-6 py-2 text-sm text-cream transition-colors hover:border-[#ffa116]"
              >
                Sign in with GitHub
              </button>
            </div>
          ) : linkedLc ? (
            <div className="mt-6 text-center">
              <div className="border-[3px] border-border bg-bg p-4">
                <p className="text-sm text-muted normal-case">Your LeetCode account</p>
                <p className="mt-2 text-lg text-cream">
                  @<span style={{ color: ACCENT }}>{linkedLc}</span>
                </p>
              </div>
              <p className="mt-4 text-sm text-muted normal-case">
                Your building is linked! Visit the{" "}
                <Link href={`/shop/${linkedLc}`} className="underline" style={{ color: ACCENT }}>
                  Shop
                </Link>{" "}
                to customize it.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <p className="mb-4 text-center text-sm text-muted normal-case">
                Your GitHub username doesn&apos;t match your LeetCode username? Link it manually below.
              </p>
              <form onSubmit={handleLink} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={lcUsername}
                  onChange={(e) => setLcUsername(e.target.value)}
                  placeholder="Your LeetCode username"
                  className="border-[3px] border-border bg-bg px-4 py-2 text-sm text-cream placeholder:text-muted/50 focus:border-[#ffa116] focus:outline-none normal-case"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !lcUsername.trim()}
                  className="border-[3px] border-border px-6 py-2 text-sm text-cream transition-colors hover:border-[#ffa116] disabled:cursor-not-allowed disabled:opacity-50"
                  style={loading ? {} : { borderColor: ACCENT }}
                >
                  {loading ? "Linking..." : "Link LeetCode Account"}
                </button>
              </form>
            </div>
          )}

          {message && (
            <p className={`mt-4 text-center text-sm normal-case ${message.ok ? "text-green-400" : "text-red-400"}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}