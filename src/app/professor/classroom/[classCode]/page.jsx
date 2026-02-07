"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseBrowser";
import * as XLSX from "xlsx";

export default function ProfessorClassPage() {
  const { classCode } = useParams();

  const [classId, setClassId] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [rollNameMap, setRollNameMap] = useState({});
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [showAttendancePanel, setShowAttendancePanel] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [attendanceCode, setAttendanceCode] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH CLASS ID ---------------- */
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

  /* ---------------- FETCH ATTENDANCE + NAMES ---------------- */
  const fetchRecords = async () => {
    if (!classId) return;

    setRecordsLoading(true);

    // 1️⃣ Fetch attendance records
    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("roll_number, status, marked_at")
      .eq("class_id", classId)
      .order("marked_at", { ascending: false });

    if (error) {
      console.error(error);
      setRecordsLoading(false);
      return;
    }

    setAttendanceRecords(records);

    // 2️⃣ Extract unique roll numbers (STRING)
    const uniqueRolls = [
      ...new Set(records.map((r) => String(r.roll_number))),
    ];

    if (uniqueRolls.length === 0) {
      setRollNameMap({});
      setRecordsLoading(false);
      return;
    }

    // 3️⃣ Fetch names from profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("roll_no, full_name")
      .in("roll_no", uniqueRolls.map(Number));

    if (profileError) {
      console.error(profileError);
      setRecordsLoading(false);
      return;
    }

    // 4️⃣ Build roll → name map
    const map = {};
    profiles.forEach((p) => {
      map[String(p.roll_no)] = p.full_name;
    });

    setRollNameMap(map);
    setRecordsLoading(false);
  };

  /* ---------------- AUTO REFRESH ---------------- */
  useEffect(() => {
    if (!classId) return;

    fetchRecords(); // initial load

    const interval = setInterval(fetchRecords, 5000); // refresh every 5 sec

    return () => clearInterval(interval);
  }, [classId]);

  /* ---------------- CREATE SESSION ---------------- */
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
        body: JSON.stringify({ classId }),
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

  /* ---------------- ACTIVATE SESSION ---------------- */
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

  /* ---------------- EXCEL DOWNLOAD ---------------- */
  const handleDownloadExcel = () => {
    if (attendanceRecords.length === 0) {
      alert("No attendance records to download");
      return;
    }

    const formattedData = attendanceRecords.map((record) => ({
      "Roll No": record.roll_number,
      // Name: rollNameMap[String(record.roll_number)] || "Unknown",
      Status: record.status,
      "Date & Time": new Date(record.marked_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(
      workbook,
      `attendance_${classCode}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ---------------- UI ---------------- */
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
            loading ? "bg-gray-400" : "bg-blue-600"
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
                isActivated ? "bg-gray-400" : "bg-green-600"
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-black">
            Attendance Records
          </h2>

          {attendanceRecords.length > 0 && (
            <button
              onClick={handleDownloadExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Download Excel
            </button>
          )}
        </div>

        {recordsLoading ? (
          <p className="text-gray-600">Loading attendance...</p>
        ) : attendanceRecords.length === 0 ? (
          <p className="text-gray-600">No attendance taken yet.</p>
        ) : (
          <div className="space-y-4">
            {attendanceRecords.map((record, index) => (
              <div key={index} className="border rounded-md p-4 bg-white">
                <div className="text-sm text-gray-500">
                  Time: {new Date(record.marked_at).toLocaleString()}
                </div>

                <div className="mt-1 font-semibold text-black">
                  Roll No: {record.roll_number} 
                  {/* —{" "} */}
                  {/* {rollNameMap[String(record.roll_number)] || "Unknown"} */}
                </div>

                <div className="text-sm text-gray-600">
                  Status: {record.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
