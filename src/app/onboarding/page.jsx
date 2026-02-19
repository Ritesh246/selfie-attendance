"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

export default function OnboardingPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState(""); // ✅ NEW
  const [rollNo, setRollNo] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 Fetch logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push("/auth/login");
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  const handleSubmit = async () => {
    if (!role) {
      setError("Please select a role");
      return;
    }

    if (
      role === "student" &&
      (!fullName || !rollNo || !department || !batch)
    ) {
      setError("Please fill all student details");
      return;
    }

    setError("");
    setLoading(true);

    const profileData = {
      id: user.id,
      role,
      full_name: role === "student" ? fullName : null, // ✅ STORED HERE
      roll_no: role === "student" ? rollNo : null,
      department: role === "student" ? department : null,
      batch: role === "student" ? batch : null,
    };

    const { error } = await supabase
      .from("profiles")
      .insert(profileData);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // 🔁 Role-based routing
    if (role === "professor") {
      router.replace("/professor/classroom"); // safer
    } else {
      router.replace("/student/register-face"); // safer
    }
  };

  if (!user) return null;

  return (
  <main className="min-h-screen flex items-center justify-center bg-[#8C92D8] px-4 py-12">
    <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-[#5A4FCF]">
          Complete Your Profile
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Just a few details to set up your GrinIn account
        </p>
      </div>

      <div className="space-y-5">

        {/* Role Selection */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all"
        >
          <option value="">Select Role</option>
          <option value="student">Student</option>
          <option value="professor">Professor</option>
        </select>

        {/* Student Fields */}
        {role === "student" && (
          <div className="space-y-4 pt-2 border-t border-gray-200">

            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all"
            />

            <input
              type="text"
              placeholder="Roll Number"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all"
            />

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all"
            >
              <option value="">Select Department</option>
              <option value="Computer">Computer</option>
              <option value="IT">IT</option>
              <option value="AIDS">AIDS</option>
            </select>

            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all"
            >
              <option value="">Select Batch</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 text-center font-medium">
            {error}
          </p>
        )}

        {/* Continue Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#5A4FCF] text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Continue"}
        </button>

      </div>
    </div>
  </main>
);

}
