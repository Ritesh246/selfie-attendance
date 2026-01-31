"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function ProfessorClassPage() {
  const { classCode } = useParams();

  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const handleActivate = () => {
    if (isActivated) return;
    setIsActivated(true);
  };

  const handleCancel = () => {
    setShowAttendancePanel(false);
    setIsActivated(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Class Heading */}
      <h1 className="text-2xl font-bold text-black mb-6">
        Professor – {classCode.toUpperCase()} Class
      </h1>

      {/* Take Attendance Button */}
      {!showAttendancePanel && (
        <button
          onClick={() => setShowAttendancePanel(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-md"
        >
          Take Attendance
        </button>
      )}

      {/* Attendance Panel */}
      {showAttendancePanel && (
        <div className="mt-6 bg-white rounded-lg shadow p-6 max-w-md">
          <h2 className="text-lg font-semibold text-black mb-4">
            Attendance Session
          </h2>

          {/* Code + Activate */}
          <div className="flex items-center gap-3 mb-4">
            <div className="border px-4 py-2 rounded font-mono text-lg text-black">
              12345
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

          {/* Cancel */}
          <button
            onClick={handleCancel}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Attendance Records */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-black mb-4">
          Attendance Records
        </h2>

        <p className="text-gray-600">
          No attendance taken yet.
        </p>
      </div>
    </div>
  );
}
