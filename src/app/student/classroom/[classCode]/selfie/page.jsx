"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseBrowser";

export default function StudentSelfiePage() {
  const { classCode } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("sessionId");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [classId, setClassId] = useState(null);

  // ✅ IMPORTANT: name must match backend
  const [selfRollNumber, setSelfRollNumber] = useState("");
  const [neighborRolls, setNeighborRolls] = useState([]);
  const [newRoll, setNewRoll] = useState("");

  const [capturedImage, setCapturedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ---------- Guards ---------- */
  useEffect(() => {
    if (!sessionId) {
      alert("Invalid session");
      router.push("/student/classroom");
    }
  }, [sessionId, router]);

  /* ---------- Fetch classId ---------- */
  useEffect(() => {
    const fetchClassId = async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id")
        .eq("code", classCode)
        .single();

      if (error || !data) {
        alert("Invalid class");
        router.push("/student/classroom");
        return;
      }

      setClassId(data.id);
    };

    fetchClassId();
  }, [classCode, router]);

  /* ---------- Camera ---------- */
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert("Camera access denied");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  /* ---------- Neighbor rolls ---------- */
  const addRoll = () => {
    const roll = newRoll.trim();
    if (!roll) return;
    if (neighborRolls.length >= 2) return;
    if (neighborRolls.includes(roll)) return;

    setNeighborRolls([...neighborRolls, roll]);
    setNewRoll("");
  };

  /* ---------- Capture selfie ---------- */
  const handleTakeSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    setCapturedImage(canvas.toDataURL("image/png"));
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!capturedImage) {
      alert("Take selfie first");
      return;
    }

    if (!selfRollNumber.trim()) {
      alert("Enter your roll number");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/attendance/selfie/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          selfRollNumber, // ✅ EXACT name backend expects
          neighborRolls,
          imageBase64: capturedImage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Submission failed");
        return;
      }

      setSubmitted(true);

      // ⏳ short delay so user sees success
      setTimeout(() => {
        router.push(`/student/classroom/${classCode}`);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-black mb-4">
        Selfie – {classCode.toUpperCase()}
      </h1>

      <div className="w-full max-w-md mb-4">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 bg-black rounded-lg object-cover"
          />
        ) : (
          <img
            src={capturedImage}
            alt="Selfie"
            className="w-full h-64 rounded-lg object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!submitted && (
        <div className="mb-4 max-w-md">
          {/* Self roll */}
          <input
            value={selfRollNumber}
            onChange={(e) => setSelfRollNumber(e.target.value)}
            placeholder="Enter your roll number"
            disabled={capturedImage}
            className="border px-3 py-2 rounded w-full text-black mb-3"
          />

          {/* Neighbor rolls */}
          <div className="flex gap-2 mb-2">
            <input
              value={newRoll}
              onChange={(e) => setNewRoll(e.target.value)}
              placeholder="Enter neighbor roll no."
              disabled={neighborRolls.length >= 2 || capturedImage}
              className="border px-3 py-2 rounded w-full text-black"
            />
            <button
              onClick={addRoll}
              disabled={neighborRolls.length >= 2 || capturedImage}
              className="px-4 py-2 rounded text-white bg-green-600"
            >
              Add
            </button>
          </div>

          {neighborRolls.length > 0 && (
            <p className="text-sm text-black">
              Neighbors:{" "}
              <span className="font-mono">{neighborRolls.join(", ")}</span>
            </p>
          )}
        </div>
      )}

      {!capturedImage ? (
        <button
          onClick={handleTakeSelfie}
          className="bg-blue-600 text-white px-6 py-3 rounded-md w-full max-w-md"
        >
          Take Selfie
        </button>
      ) : !submitted ? (
        <div className="flex gap-3 max-w-md">
          <button
            onClick={handleRetake}
            className="border px-4 py-2 rounded w-full"
          >
            Retake
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded w-full text-white ${
              isSubmitting ? "bg-gray-400" : "bg-blue-600"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      ) : (
        <p className="text-green-600 font-semibold">Attendance submitted ✔</p>
      )}
    </div>
  );
}
