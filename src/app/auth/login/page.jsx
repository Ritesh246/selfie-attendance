"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email + Password login
  const handleEmailLogin = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Login successful → go to onboarding (profile check comes next step)
    router.push("/onboarding");
  };

  // Google login
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });

    setLoading(false);

    if (error) setError(error.message);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        
        <h1 className="text-2xl font-bold text-neutral-900 text-center mb-6">
          Login
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
          />

          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:bg-neutral-800 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login with Email"}
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-neutral-300" />
            <span className="text-sm text-neutral-500">OR</span>
            <div className="flex-1 h-px bg-neutral-300" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full gap-1 flex justify-center items-center border border-neutral-300 py-2 rounded text-neutral-800 hover:bg-neutral-100 transition"
          >
            <img className="w-8 h-8" src="/google.png" alt="google" />
            Continue with Google
          </button>
        </div>

        <p className="text-sm text-center mt-6 text-neutral-600">
          Don’t have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-black">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
