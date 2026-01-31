"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentClassPage() {
  const { classCode } = useParams();
  const router = useRouter();

  const [attendanceCode, setAttendanceCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = () => {
    if (!attendanceCode.trim()) return;
    if (isJoining) return;

    setIsJoining(true);

    // UI-only simulation (later replaced by code validation API)
    setTimeout(() => {
      router.push(`/student/classroom/${classCode}/selfie`);
    }, 800);
  };

  const isDisabled = !attendanceCode.trim() || isJoining;

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Student – {classCode.toUpperCase()} Class
      </h1>

      <p style={{ marginTop: "10px", color: "#555" }}>
        Enter the attendance code shared by your professor.
      </p>

      {/* Attendance Code Input */}
      <input
        value={attendanceCode}
        onChange={(e) => setAttendanceCode(e.target.value)}
        placeholder="Enter attendance code"
        disabled={isJoining}
        style={{
          marginTop: "16px",
          padding: "10px",
          width: "260px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "16px",
        }}
      />

      {/* Join Button */}
      <div>
        <button
          onClick={handleJoin}
          disabled={isDisabled}
          style={{
            marginTop: "16px",
            padding: "12px 20px",
            backgroundColor: isDisabled ? "#9ca3af" : "#2563eb",
            color: "white",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          {isJoining ? "Joining..." : "Join"}
        </button>
      </div>
    </div>
  );
}
