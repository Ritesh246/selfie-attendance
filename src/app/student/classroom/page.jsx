"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

export default function StudentClassroomPage() {
  const router = useRouter();

  // ---------- STATE ----------
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState("");
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
    const { error: joinError } = await supabase.from("class_students").insert({
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
      <div className="min-h-screen flex text-3xl text-blue-900 font-semibold items-center bg-[#8C92D8] justify-center">
        Checking access...
      </div>
    );
  }

  // ---------- UI ----------
  return (
  <div className="min-h-screen bg-[#8C92D8]">

    {/* Top Bar */}
    <div className="flex items-center justify-between px-6 mx-1.5 py-3 rounded-4xl translate-y-2 bg-white/95 backdrop-blur-md shadow-md">
      <h1 className="text-2xl font-bold text-[#5A4FCF]">
        Student
      </h1>

      <button
        onClick={openModal}
        className="bg-[#5A4FCF] text-white px-3 py-2 rounded-2xl font-medium shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-300"
      >
        Join Class
      </button>
    </div>

    <div className="text-white text-4xl font-semibold font-mono flex items-center justify-center pt-10">
      Classroom
    </div>

    {/* Classes Section */}
    <div className="p-6 md:p-10">

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-23 text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">
            No classes joined yet
          </h2>
          <p className="text-white/80 text-sm mb-6">
            Join a class using the code shared by your professor.
          </p>
          <button
            onClick={openModal}
            className="bg-white text-[#5A4FCF] px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all"
          >
            Join Your First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {classes.map((cls) => (
            <div
              key={cls.id}
              onClick={() =>
                router.push(`/student/classroom/${cls.code}`)
              }
              className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <h2 className="text-xl font-semibold text-[#5A4FCF] mb-2">
                {cls.name}
              </h2>

              <div className="text-sm text-gray-500">
                Click to enter classroom
              </div>
            </div>
          ))}

        </div>
      )}
    </div>

    {/* Join Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">

          <h2 className="text-2xl font-bold text-[#5A4FCF] mb-6">
            Join a Class
          </h2>

          <input
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder="Enter class code"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all mb-4"
          />

          {error && (
            <p className="text-sm text-red-600 mb-4 font-medium">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={joinClass}
              disabled={loading}
              className="bg-[#5A4FCF] text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-[1.03] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
