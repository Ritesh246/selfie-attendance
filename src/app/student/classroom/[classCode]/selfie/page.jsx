"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

export default function StudentSelfiePage() {
  const { classCode } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("sessionId");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
    if (roll === selfRollNumber.trim()) return;

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          selfRollNumber,
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

      setTimeout(() => {
        router.replace(`/student/classroom/`);
      }, 2000);
    } catch {
      alert("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-[#8C92D8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 text-center">
        {/* Header */}
        <h1 className="text-2xl font-extrabold text-[#5A4FCF] mb-2">
          {classCode.toUpperCase()} Attendance
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          Capture your selfie to mark attendance
        </p>

        {/* Camera Frame */}
        <div className="w-full mb-6 rounded-xl overflow-hidden border-4 border-[#E6E8FF] bg-black shadow-inner">
          {!capturedImage ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
          ) : (
            <img
              src={capturedImage}
              alt="Selfie"
              className="w-full h-64 object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {!submitted && (
          <div className="mb-6 space-y-4">
            {/* Self Roll */}
            <input
              value={selfRollNumber}
              onChange={(e) => setSelfRollNumber(e.target.value)}
              placeholder="Enter your roll number"
              disabled={capturedImage}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition disabled:bg-gray-100"
            />

            {/* Neighbor Rolls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newRoll}
                onChange={(e) => setNewRoll(e.target.value)}
                placeholder="Neighbor roll no."
                disabled={neighborRolls.length >= 2 || capturedImage}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A4FCF] focus:border-transparent transition disabled:bg-gray-100"
              />
              <button
                onClick={addRoll}
                disabled={neighborRolls.length >= 2 || capturedImage}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#5A4FCF] text-white font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {neighborRolls.length > 0 && (
              <p className="text-sm text-gray-600">
                Neighbors:{" "}
                <span className="font-mono text-[#5A4FCF]">
                  {neighborRolls.join(", ")}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Buttons */}
        {!capturedImage ? (
          <button
            onClick={handleTakeSelfie}
            className="w-full bg-[#5A4FCF] text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
          >
            Take Selfie
          </button>
        ) : !submitted ? (
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              className="w-1/2 border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-100 transition"
            >
              Retake
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-1/2 py-3 rounded-xl font-semibold text-white transition-all ${
                isSubmitting
                  ? "bg-gray-400"
                  : "bg-[#5A4FCF] hover:shadow-lg hover:scale-[1.02]"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        ) : (
          <p className="text-green-600 font-semibold text-lg">
            Attendance submitted ✔
          </p>
        )}
      </div>
    </div>
  );
}
