"use client";

import { useState } from "react";
import { GoogleGIcon, XIcon } from "../shared/icons";
import { useGeoGemma } from "./geogemma-store";

export default function SignInModal() {
  const { authDismissed, signInMock, dismissAuth } = useGeoGemma();
  const [busy, setBusy] = useState(false);

  if (authDismissed) return null;

  const handleSignIn = () => {
    setBusy(true);
    window.setTimeout(() => {
      signInMock();
      setBusy(false);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={dismissAuth}
      role="dialog"
      aria-modal="true"
      aria-label="Sign In Required"
    >
      <div
        className="w-[420px] max-w-full overflow-hidden rounded-xl border border-white/10 bg-[#10192e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-slate-100">Sign In Required</h2>
          <button
            type="button"
            onClick={dismissAuth}
            aria-label="Close"
            className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>
        <div className="px-5 py-6 text-center">
          <p className="mb-5 text-sm text-slate-300">
            Please sign in to use GeoGemma&apos;s features.
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={busy}
            className="mx-auto flex items-center gap-2.5 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-70"
          >
            <GoogleGIcon />
            {busy ? "Signing in…" : "Sign in with Google"}
          </button>
          <p className="mt-4 text-xs text-slate-500">
            Demo build — sign-in is a local mock, no account needed. You can also close this dialog to
            continue as guest.
          </p>
        </div>
      </div>
    </div>
  );
}
