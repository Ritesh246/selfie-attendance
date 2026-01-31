"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseBrowser";

export default function ProfessorClassPage() {
  const { classCode } = useParams();

  const [classId, setClassId] = useState(null);

  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [attendanceCode, setAttendanceCode] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 FETCH CLASS UUID USING CLASS CODE
  useEffect(() => {
    const fetchClassId = async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id")
        .eq("code", classCode)
        .single();

      if (error) {
        console.error(error);
        alert("Failed to load class");
        return;
      }

      setClassId(data.id);
    };

    fetchClassId();
  }, [classCode]);

  // 🔹 CREATE ATTENDANCE SESSION (FIXED)
  const handleCreateSession = async () => {
    if (!classId) {
      alert("Class not loaded yet");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/attendance/session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classId, // ✅ FIXED (UUID, not classCode)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create session");
        return;
      }

      setSessionId(data.sessionId);
      setAttendanceCode(data.attendanceCode);
      setShowAttendancePanel(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 ACTIVATE SESSION
  const handleActivate = async () => {
    if (!sessionId || isActivated) return;

    try {
      const res = await fetch("/api/attendance/session/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to activate");
        return;
      }

      setIsActivated(true);

      // UI auto-hide after 10 sec (DB handled separately)
      setTimeout(() => {
        setIsActivated(false);
        setShowAttendancePanel(false);
      }, 10000);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const handleCancel = () => {
    setShowAttendancePanel(false);
    setIsActivated(false);
    setSessionId(null);
    setAttendanceCode(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-black mb-6">
        Professor – {classCode.toUpperCase()} Class
      </h1>

      {!showAttendancePanel && (
        <button
          onClick={handleCreateSession}
          disabled={loading}
          className={`px-6 py-3 rounded-md text-white ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
          }`}
        >
          {loading ? "Creating session..." : "Take Attendance"}
        </button>
      )}

      {showAttendancePanel && (
        <div className="mt-6 bg-white rounded-lg shadow p-6 max-w-md">
          <h2 className="text-lg font-semibold text-black mb-4">
            Attendance Session
          </h2>

          <div className="flex items-center gap-3 mb-4">
            <div className="border px-4 py-2 rounded font-mono text-lg text-black">
              {attendanceCode || "-----"}
            </div>

            <button
              onClick={handleActivate}
              disabled={isActivated}
              className={`px-4 py-2 rounded text-white ${
                isActivated
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600"
              }`}
            >
              {isActivated ? "Activated" : "Activate"}
            </button>
          </div>

          <button onClick={handleCancel} className="border px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-black mb-4">
          Attendance Records
        </h2>
        <p className="text-gray-600">No attendance taken yet.</p>
      </div>
    </div>
  );
}
