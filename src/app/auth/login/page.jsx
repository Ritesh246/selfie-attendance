"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const redirectingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------- Central post-login routing ---------- */
  const handlePostLoginRedirect = async () => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      redirectingRef.current = false;
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, face_registered")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.role) {
      router.replace("/onboarding");
      return;
    }

    if (profile.role === "student" && !profile.face_registered) {
      router.replace("/student/register-face");
      return;
    }

    if (profile.role === "student") {
      router.replace("/student/classroom");
      return;
    }

    if (profile.role === "professor") {
      router.replace("/professor/classroom");
      return;
    }

    router.replace("/onboarding");
  };

  /* ---------- Auth state listener ---------- */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") {
          setLoading(true);
          handlePostLoginRedirect();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* ---------- Email login ---------- */
  const handleEmailLogin = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  /* ---------- Google login ---------- */
  const handleGoogleLogin = async () => {
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/login`,
      },
    });

    if (error) setError(error.message);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950">
        <p className="text-white text-lg animate-pulse">
          Redirecting to Classroom...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded text-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded text-black"
          />

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            onClick={handleEmailLogin}
            className="w-full bg-black text-white py-2 rounded"
          >
            Login with Email
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-neutral-300" />
            <span className="text-sm text-neutral-500">OR</span>
            <div className="flex-1 h-px bg-neutral-300" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-2 border py-2 rounded"
          >
            <img src="/google.png" className="w-8 h-8" alt="google" />
            Continue with Google
          </button>
        </div>

        <p className="text-sm text-center mt-6">
          Don’t have an account?{" "}
          <Link href="/auth/register" className="font-semibold">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
