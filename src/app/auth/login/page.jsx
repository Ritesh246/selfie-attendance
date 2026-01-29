"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔑 CENTRAL POST-LOGIN ROUTING LOGIC (Untouched)
  const handlePostLoginRedirect = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, face_registered")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.role) {
      router.push("/onboarding");
      return;
    }

    if (profile.role === "student" && !profile.face_registered) {
      router.push("/student/register-face");
      return;
    }

    if (profile.role === "student") {
      router.push("/student/classroom");
      return;
    }

    if (profile.role === "professor") {
      router.push("/professor/classroom");
      return;
    }

    router.push("/onboarding");
  };

  // ⚡️ EFFECT: Handle the "Return" from Google
  useEffect(() => {
    // 1. If we are returning from Google (flag is set), SHOW the message immediately
    if (typeof window !== 'undefined' && localStorage.getItem("isGoogleLogin") === "true") {
      setLoading(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // 2. We are signed in, clear flag and keep showing message while we redirect
        if (typeof window !== 'undefined') localStorage.removeItem("isGoogleLogin");
        setLoading(true); 
        handlePostLoginRedirect();
      } else if (event === "SIGNED_OUT") {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleEmailLogin = async () => {
    setError("");
    setLoading(true); // Keep loading true for Email login (that's fine)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    // ❌ REMOVED: setLoading(true) is gone. 
    // This ensures no message appears when you click the button.
    
    // Set flag so we show the message ONLY when you come back
    if (typeof window !== 'undefined') localStorage.setItem("isGoogleLogin", "true");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/login`,
      },
    });

    if (error) {
      if (typeof window !== 'undefined') localStorage.removeItem("isGoogleLogin");
      setError(error.message);
    }
  };

  // 🛑 REDIRECTING SCREEN (Only shows when returning from Google)
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="text-white text-lg animate-pulse">
          Redirecting to Classroom...
        </div>
      </main>
    );
  }

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
            className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-800"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-800"
          />

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
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
            className="w-full gap-1 flex justify-center items-center border border-neutral-300 py-2 rounded text-neutral-800 hover:bg-neutral-100 transition "
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