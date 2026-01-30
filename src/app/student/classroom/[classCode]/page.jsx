"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function StudentClassPage() {
  const { classCode } = useParams();
  const router = useRouter();

  const [attendanceCode, setAttendanceCode] = useState("");

  const handleJoin = () => {
    if (!attendanceCode.trim()) return;
    // Validation will come later
    router.push(`/student/classroom/${classCode}/selfie`);
  };

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
          style={{
            marginTop: "16px",
            padding: "12px 20px",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "6px",
            fontSize: "16px",
          }}
        >
          Join
        </button>
      </div>
    </div>
  );
}
