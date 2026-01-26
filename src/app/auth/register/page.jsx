"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseBrowser";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignup = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/onboarding");
  };

  const handleGoogleSignup = async () => {
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
          Create Account
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-black border border-neutral-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-black border border-neutral-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-black"
          />

          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleEmailSignup}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:bg-neutral-800 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up with Email"}
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-neutral-300" />
            <span className="text-sm text-neutral-500">OR</span>
            <div className="flex-1 h-px bg-neutral-300" />
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full gap-1 flex justify-center items-center border border-neutral-300 py-2 rounded text-neutral-800 hover:bg-neutral-100 transition"
          >
            <img className="w-8 h-8" src="/google.png" alt="google" />
            Continue with Google
          </button>
        </div>

        <p className="text-sm text-center mt-6 text-neutral-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-black">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
