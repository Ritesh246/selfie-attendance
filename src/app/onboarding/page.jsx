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
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-neutral-900 mb-6">
          Complete Your Profile
        </h1>

        <div className="space-y-4">
          {/* Role selection */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-900"
          >
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="professor">Professor</option>
          </select>

          {/* 🎓 Student-only fields */}
          {role === "student" && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-900"
              />

              <input
                type="text"
                placeholder="Roll Number"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-900"
              />

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-900"
              >
                <option value="">Select Department</option>
                <option value="Computer">Computer</option>
                <option value="IT">IT</option>
                <option value="AIDS">AIDS</option>
              </select>

              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full border border-neutral-300 px-3 py-2 rounded text-neutral-900"
              >
                <option value="">Select Batch</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded hover:bg-neutral-800 transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
