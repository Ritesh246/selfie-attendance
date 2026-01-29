"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

export default function StudentClassroomPage() {
  const router = useRouter();

  // ---------- STATE ----------
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [classes, setClasses] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------- HELPERS ----------
  const openModal = () => {
    setClassCode("");
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // ---------- AUTH + FETCH ----------
  useEffect(() => {
    const checkAccessAndFetch = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "student") {
        router.push("/professor/classroom");
        return;
      }

      // Fetch joined classes
      const { data: joined } = await supabase
        .from("class_students")
        .select("classes(*)")
        .eq("student_id", user.id);

      const classList = joined?.map((j) => j.classes) || [];
      setClasses(classList);

      setCheckingAuth(false);
    };

    checkAccessAndFetch();
  }, [router]);

  // ---------- JOIN CLASS ----------
  const joinClass = async () => {
    if (!classCode.trim()) return;

    setLoading(true);
    setError("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    // 1. Find class by code
    const { data: foundClass } = await supabase
      .from("classes")
      .select("id")
      .eq("code", classCode)
      .single();

    if (!foundClass) {
      setError("Invalid class code");
      setLoading(false);
      return;
    }

    // 2. Join class
    const { error: joinError } = await supabase
      .from("class_students")
      .insert({
        class_id: foundClass.id,
        student_id: user.id,
      });

    if (joinError) {
      setError("You already joined this class");
      setLoading(false);
      return;
    }

    // 3. Refresh joined classes
    const { data: joined } = await supabase
      .from("class_students")
      .select("classes(*)")
      .eq("student_id", user.id);

    setClasses(joined?.map((j) => j.classes) || []);
    setLoading(false);
    setShowModal(false);
  };

  // ---------- LOADING ----------
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking access...
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h1 className="text-2xl font-semibold text-black">
          Student Classroom
        </h1>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Join a class
        </button>
      </div>

      {/* Classes */}
      <div className="p-6">
        {classes.length === 0 ? (
          <p className="text-center text-black mt-20">
            No classes joined yet
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-xl font-semibold text-black">
                  {cls.name}
                </h2>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              Join a class
            </h2>

            <input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Enter class code"
              className="w-full border px-3 py-2 rounded mb-3 text-black"
            />

            {error && (
              <p className="text-sm text-red-600 mb-3">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="border px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={joinClass}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {loading ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
