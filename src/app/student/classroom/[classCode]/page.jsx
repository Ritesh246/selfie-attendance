"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudentClassPage() {
  const { classCode } = useParams();
  const router = useRouter();
 
  const [classId, setClassId] = useState(null);
  const [className, setClassName] = useState("");
  const [attendanceCode, setAttendanceCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* --------------------------------------------------
     1️⃣ Fetch classId using classCode (ON PAGE LOAD)
  -------------------------------------------------- */
  useEffect(() => {
    const fetchClassId = async () => {
      try {
        const res = await fetch(
          `/api/classes/by-code?classCode=${classCode}`
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Class not found");
          return;
        }

        setClassId(data.classId);
        setClassName(data.className);
      } catch (err) {
        console.error(err);
        setError("Failed to load class");
      }
    };

    fetchClassId();
  }, [classCode]);

  /* --------------------------------------------------
     2️⃣ Verify attendance code
  -------------------------------------------------- */
  const handleVerifyCode = async () => {
    if (!attendanceCode.trim()) {
      setError("Please enter attendance code");
      return;
    }

    if (!classId) {
      setError("Class not loaded yet");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/attendance/session/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          attendanceCode,
        }),
      });

      const text = await res.text(); // 🔥 SAFE PARSE
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        setError(data.error || "Invalid or expired code");
        return;
      }

      // ✅ SUCCESS → go to selfie page
      router.push(
        `/student/classroom/${classCode}/selfie?sessionId=${data.sessionId}`
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  return (
  <div className="min-h-screen bg-[#8C92D8] flex items-center justify-center px-4 py-12">

    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center">

      {/* Header */}
      <h1 className="text-3xl font-extrabold text-[#5A4FCF] mb-2">
        {className.toUpperCase()} Class
      </h1>

      <p className="text-sm text-gray-500 mb-8">
        Enter the attendance code shared by your professor
      </p>

      {/* Input */}
      <input
        value={attendanceCode}
        onChange={(e) => setAttendanceCode(e.target.value)}
        placeholder="Enter attendance code"
        disabled={loading}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-lg tracking-widest font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all mb-5 disabled:bg-gray-100"
      />

      {/* Button */}
      <button
        onClick={handleVerifyCode}
        disabled={loading || !classId}
        className="w-full bg-[#5A4FCF] text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Verifying..." : "Join Attendance"}
      </button>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 mt-4 font-medium">
          {error}
        </p>
      )}

    </div>
  </div>
);

}
