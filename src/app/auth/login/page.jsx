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

//   if (loading) {
//   return (
//     <main className="min-h-screen flex items-center justify-center bg-[#8C92D8]">
//       <div className="text-center space-y-3">
//         <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
//         <p className="text-white text-lg font-medium">
//           Redirecting to Classroom...
//         </p>
//       </div>
//     </main>
//   );
// }

return (
  <main className="min-h-screen flex items-center justify-center bg-[#8C92D8] px-4 py-12">
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">

      {/* Brand */}
      <div className="text-center mb-3">
        <h1 className="text-3xl font-extrabold text-[#5A4FCF]">
          Welcome back to <span className="text-4xl text-violet-950 font-mono">GrinIn</span> 
        </h1>
      </div>

      <div className="space-y-5">

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all text-black"
        />

        {/* Password */}
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

        {/* Email Login Button */}
        <button
          onClick={handleEmailLogin}
          className="w-full bg-[#5A4FCF] text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
        >
          Login with Email
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex justify-center items-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition-all duration-300"
        >
          <img src="/google.png" className="w-5 h-5" alt="google" />
          <span className="font-medium text-gray-700">
            Continue with Google
          </span>
        </button>
      </div>

      {/* Register Link */}
      <p className="text-sm text-center mt-8 text-gray-600">
        Don’t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-[#5A4FCF] hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  </main>
);

}
