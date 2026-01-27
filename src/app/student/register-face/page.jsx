"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

export default function RegisterFacePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const router = useRouter();

  const [user, setUser] = useState(null);
  const [captured, setCaptured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push("/auth/login");
      } else {
        setUser(data.user);
      }
    });
  }, [router]);

  /* ---------------- START CAMERA ---------------- */
  useEffect(() => {
  let mediaStream;
  let checkInterval;

  const startCamera = async () => {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();

        // 🔑 reliable readiness check
        checkInterval = setInterval(() => {
          if (
            videoRef.current &&
            videoRef.current.videoWidth > 0 &&
            videoRef.current.videoHeight > 0
          ) {
            setCameraReady(true);
            clearInterval(checkInterval);
          }
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setError("Camera access denied");
    }
  };

  startCamera();

  return () => {
    if (checkInterval) clearInterval(checkInterval);
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
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

    // ✅ This is the IMPORTANT readiness check
    if (video.readyState < 2) {
      setError("Camera still starting…");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    setCaptured(true); // ✅ shows Submit & Continue
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

      // stop camera AFTER success
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      router.push("/student/dashboard");
    }, "image/jpeg");
  };

  if (!user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Register Your Face
        </h1>

        <p className="text-sm text-neutral-600 mb-4">
          This will be used for attendance verification
        </p>

        {!captured ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded mb-4"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full rounded mb-4"
          />
        )}

        {error && (
          <p className="text-sm text-red-600 mb-2">{error}</p>
        )}

        {!captured ? (
          <button
            onClick={capturePhoto}
            disabled={!cameraReady}
            className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
          >
            {cameraReady ? "Capture Face" : "Starting Camera…"}
          </button>
        ) : (
          <button
            onClick={submitPhoto}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Submit & Continue"}
          </button>
        )}
      </div>
    </main>
  );
}
