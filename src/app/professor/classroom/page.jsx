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
        Professor
      </h1>

      <button
        onClick={openModal}
        className="bg-[#5A4FCF] text-white px-5 py-2.5 rounded-3xl font-medium shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-300"
      >
       Create Class
      </button>
    </div>

    <div className="text-white text-4xl font-semibold font-mono flex items-center justify-center pt-10">
      Classroom
    </div>

    {/* Classes Section */}
    <div className="p-6 py-4 md:p-10 ">

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 text-center">
          <h2 className="text-2xl font-semibold text-white mb-2">
            No classes yet
          </h2>
          <p className="text-white/80 text-sm mb-6">
            Create your first class and start taking attendance.
          </p>
          <button
            onClick={openModal}
            className="bg-white text-[#5A4FCF] px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] transition-all"
          >
            Create Your First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {classes.map((cls) => (
            <div
              key={cls.id}
              onClick={() =>
                router.push(`/professor/classroom/${cls.code}`)
              }
              className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <h2 className="text-xl font-semibold text-[#5A4FCF] mb-3">
                {cls.name}
              </h2>

              <div className="text-sm text-gray-600">
                Class Code
              </div>

              <div className="mt-1 font-mono text-lg text-gray-800 tracking-wide">
                {cls.code}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>

    {/* Create Class Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">

          <h2 className="text-2xl font-bold text-[#5A4FCF] mb-6">
            Create a New Class
          </h2>

          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Class name (e.g. IOT)"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition-all mb-4"
          />

          <input
            value={classCode}
            readOnly
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 font-mono text-gray-700 mb-6"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>

            <button
              onClick={createClass}
              disabled={loading}
              className="bg-[#5A4FCF] text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-[1.03] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
