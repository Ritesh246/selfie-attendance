"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

export default function RegisterFacePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const cameraStartedRef = useRef(false);

  const router = useRouter();

  const [user, setUser] = useState(null);
  const [captured, setCaptured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  /* ---------------- AUTH + FACE GUARD ---------------- */
  useEffect(() => {
    const checkUserAndFace = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.replace("/auth/login");
        return;
      }

      setUser(data.user);

      // 🔒 Guard: if face already registered, NEVER allow this page
      const { data: profile } = await supabase
        .from("profiles")
        .select("face_registered")
        .eq("id", data.user.id)
        .single();

      if (profile?.face_registered) {
        router.replace("/student/classroom");
      }
    };

    checkUserAndFace();
  }, [router]);

  /* ---------------- START CAMERA ---------------- */
  useEffect(() => {
    if (cameraStartedRef.current) return;
    cameraStartedRef.current = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setCameraReady(true);
            videoRef.current.play();
          };
        }
      } catch (err) {
        console.error(err);
        setError("Camera access denied");
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /* ---------------- AUTO HIDE ERROR ---------------- */
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 2000);
    return () => clearTimeout(t);
  }, [error]);

  /* ---------------- CAPTURE PHOTO ---------------- */
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError("Camera not ready");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera initializing… please wait");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCaptured(true);
  };

  /* ---------------- RETAKE PHOTO ---------------- */
  const retakePhoto = () => {
    setCaptured(false);
  };

  /* ---------------- SUBMIT PHOTO ---------------- */
  const submitPhoto = async () => {
    if (!user || !canvasRef.current) return;

    setLoading(true);
    setError("");

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setError("Failed to capture image");
        setLoading(false);
        return;
      }

      const filePath = `students/${user.id}.jpg`;

      // 1️⃣ Upload image
      const { error: uploadError } = await supabase.storage
        .from("face-images")
        .upload(filePath, blob, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      // 2️⃣ Update profile
      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          face_image_path: filePath,
          face_registered: true,
        })
        .eq("id", user.id);

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }

      // 3️⃣ Fetch role
      const { data: profile, error: roleError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setLoading(false);

      if (roleError) {
        setError(roleError.message);
        return;
      }

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // ✅ IMPORTANT: replace, NOT push
      if (profile.role === "professor") {
        router.replace("/professor/classroom");
      } else {
        router.replace("/student/classroom");
      }
    }, "image/jpeg");
  };

  if (!user) return null;

  return (
  <main className="min-h-screen flex items-center justify-center bg-[#8C92D8] px-4 py-12">
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#5A4FCF]">
          Register Your Face
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          This will be used for secure attendance verification
        </p>
      </div>

      {/* Camera Frame */}
      <div className="relative w-full mb-6 rounded-xl overflow-hidden border-4 border-[#E6E8FF] shadow-inner bg-gray-100">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full ${captured ? "hidden" : "block"}`}
        />

        <canvas
          ref={canvasRef}
          className={`w-full ${!captured ? "hidden" : "block"}`}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 mb-4 font-medium">
          {error}
        </p>
      )}

      {/* Buttons */}
      {!captured ? (
        <button
          onClick={capturePhoto}
          disabled={!cameraReady}
          className="w-full bg-[#5A4FCF] text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cameraReady ? "Capture Face" : "Starting Camera…"}
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={retakePhoto}
            disabled={loading}
            className="w-1/2 bg-gray-200 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-300 transition disabled:opacity-60"
          >
            Retake
          </button>

          <button
            onClick={submitPhoto}
            disabled={loading}
            className="w-1/2 bg-[#5A4FCF] text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Uploading..." : "Submit"}
          </button>
        </div>
      )}

    </div>
  </main>
);

}
