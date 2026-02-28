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

  /* ---------- Email signup ---------- */
  const handleEmailSignup = async () => {
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is required
    if (!data.session) {
      alert("Please check your email to confirm your account.");
      return;
    }

    router.replace("/onboarding");
  };

  /* ---------- Google signup ---------- */
  const handleGoogleSignup = async () => {
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/login`,
      },
    });

    if (error) setError(error.message);
  };

  return (
  <main className="min-h-screen flex items-center justify-center bg-[#8C92D8] px-4 py-12">
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">

      {/* Brand Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-[#5A4FCF]">
          Join <span className="text-4xl text-violet-950 font-mono">GrinIn</span> 
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Create your GenZ vala attendance account
        </p>
      </div>

      <div className="space-y-5">

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all text-black"
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all text-black"
        />

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 text-center font-medium">
            {error}
          </p>
        )}

        {/* Email Signup Button */}
        <button
          onClick={handleEmailSignup}
          disabled={loading}
          className="w-full bg-[#5A4FCF] text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Sign up with Email"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Google Signup */}
        <button
          onClick={handleGoogleSignup}
          className="w-full flex justify-center items-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300"
        >
          <img src="/google.png" className="w-5 h-5" alt="google" />
          <span className="font-medium text-gray-700">
            Continue with Google
          </span>
        </button>
      </div>

      {/* Login Redirect */}
      <p className="text-sm text-center mt-8 text-gray-600">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-[#5A4FCF] hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  </main>
);

}
