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
  <div className="min-h-screen bg-[#8C92D8] px-4 md:px-8 py-8">

    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <h1 className="text-3xl font-bold text-white">
        {classCode.toUpperCase()} Class
      </h1>

      {!showAttendancePanel && (
        <button
          onClick={handleCreateSession}
          disabled={loading}
          className={`px-6 py-3 rounded-xl font-semibold shadow-md transition-all ${
            loading
              ? "bg-gray-400 text-white"
              : "bg-white text-[#5A4FCF] hover:shadow-lg hover:scale-[1.03]"
          }`}
        >
          {loading ? "Creating session..." : "Take Attendance"}
        </button>
      )}
    </div>

    {/* Attendance Panel */}
    {showAttendancePanel && (
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg mb-10">

        <h2 className="text-xl font-bold text-[#5A4FCF] mb-6">
          Attendance Session
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">

          <div className="flex-1 border-2 border-[#E6E8FF] px-6 py-4 rounded-xl font-mono text-2xl text-center tracking-widest text-gray-800">
            {attendanceCode || "-----"}
          </div>

          <button
            onClick={handleActivate}
            disabled={isActivated}
            className={`px-5 py-3 rounded-xl font-semibold transition-all ${
              isActivated
                ? "bg-gray-400 text-white"
                : "bg-[#5A4FCF] text-white hover:shadow-lg hover:scale-[1.03]"
            }`}
          >
            {isActivated ? "Activated" : "Activate"}
          </button>
        </div>

        <button
          onClick={handleCancel}
          className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    )}

    {/* Records Section */}
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-[#5A4FCF]">
          Attendance Records
        </h2>

        {attendanceRecords.length > 0 && (
          <button
            onClick={handleDownloadExcel}
            className="px-5 py-2.5 bg-[#5A4FCF] text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-[1.03] transition-all"
          >
            Download Excel
          </button>
        )}
      </div>

      {recordsLoading ? (
        <p className="text-gray-600">Loading attendance...</p>
      ) : attendanceRecords.length === 0 ? (
        <p className="text-gray-600">
          No attendance taken yet.
        </p>
      ) : (
        <div className="space-y-4">

          {attendanceRecords.map((record, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white"
            >
              <div className="text-xs text-gray-500 mb-1">
                {new Date(record.marked_at).toLocaleString()}
              </div>

              <div className="font-semibold text-gray-800">
                Roll No: {record.roll_number}
              </div>

              <div className="text-sm text-gray-600 mt-1">
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
