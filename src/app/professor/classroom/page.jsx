"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

export default function ProfessorClassroomPage() {
  const router = useRouter();

  // ---------- STATE ----------
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [classes, setClasses] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- HELPERS ----------
  const generateClassCode = () => Math.random().toString(36).substring(2, 7);

  const openModal = () => {
    setClassName("");
    setClassCode(generateClassCode());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // ---------- ROUTE PROTECTION + FETCH ----------
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

      if (!profile || profile.role !== "professor") {
        router.push("/student/classroom");
        return;
      }

      // Fetch only this professor's classes
      const { data: classData } = await supabase
        .from("classes")
        .select("*")
        .eq("professor_id", user.id)
        .order("created_at", { ascending: false });

      setClasses(classData || []);
      setCheckingAuth(false);
    };

    checkAccessAndFetch();
  }, [router]);

  // ---------- CREATE CLASS ----------
  const createClass = async () => {
    if (!className.trim()) return;

    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    await supabase.from("classes").insert({
      name: className,
      code: classCode,
      professor_id: user.id,
    });

    // Refresh classes
    const { data: classData } = await supabase
      .from("classes")
      .select("*")
      .eq("professor_id", user.id)
      .order("created_at", { ascending: false });

    setClasses(classData || []);
    setLoading(false);
    setShowModal(false);
  };

  // ---------- LOADING GUARD ----------
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
          Professor Classroom
        </h1>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create a class
        </button>
      </div>

      {/* Classes Grid */}
      <div className="p-6">
        {classes.length === 0 ? (
          <p className="text-center text-black mt-20">No classes created yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 cursor-pointer">
            {classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => router.push(`/professor/classroom/${cls.code}`)}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold text-black mb-2">
                  {cls.name}
                </h2>
                <p className="text-black">
                  Class Code: <span className="font-mono">{cls.code}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4">
              Create a new class
            </h2>

            <input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Class name (e.g. IOT)"
              className="w-full border px-3 py-2 rounded mb-4 text-black"
            />

            <input
              value={classCode}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100 font-mono mb-6 text-black"
            />

            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="border px-4 py-2 rounded">
                Cancel
              </button>
              <button
                onClick={createClass}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
