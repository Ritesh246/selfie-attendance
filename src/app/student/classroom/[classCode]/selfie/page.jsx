"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function StudentSelfiePage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { classCode } = useParams();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [rollNumbers, setRollNumbers] = useState([]);
  const [newRoll, setNewRoll] = useState("");

  const [capturedImage, setCapturedImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- Start Camera ----------
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  // ---------- Roll Number Constraints (G1) ----------
  const addRollNumber = () => {
    if (!newRoll.trim()) return;
    if (rollNumbers.length >= 2) return;
    if (rollNumbers.includes(newRoll.trim())) return;

    setRollNumbers([...rollNumbers, newRoll.trim()]);
    setNewRoll("");
  };

  const maxLimitReached = rollNumbers.length >= 2;

  // ---------- Capture Frame (Improved G2) ----------
  const handleTakeSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);

    stopCamera();
  };

  // ---------- Retake ----------
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  // ---------- Submit (UI only) ----------
  const handleSubmit = () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Later: upload + face recognition
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Selfie submitted (UI-only demo)");
    }, 1500);
  };

  if (!sessionId) {
    return (
      <div className="p-6 text-red-500">
        Invalid or expired attendance session
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-black mb-4">
        Selfie Time – {classCode.toUpperCase()}
      </h1>

      {/* Camera or Preview */}
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
            alt="Captured selfie"
            className="w-full h-64 rounded-lg object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Roll Numbers */}
      <div className="mb-4 max-w-md">
        <div className="flex gap-2 mb-2">
          <input
            value={newRoll}
            onChange={(e) => setNewRoll(e.target.value)}
            placeholder="Enter roll no."
            disabled={maxLimitReached || capturedImage}
            className="border px-3 py-2 rounded w-full text-black"
          />
          <button
            onClick={addRollNumber}
            disabled={maxLimitReached || capturedImage}
            className={`px-4 py-2 rounded text-white ${
              maxLimitReached || capturedImage
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600"
            }`}
          >
            Add +
          </button>
        </div>

        {rollNumbers.length > 0 && (
          <p className="text-sm text-black">
            Added roll numbers:{" "}
            <span className="font-mono">{rollNumbers.join(", ")}</span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {!capturedImage ? (
        <button
          onClick={handleTakeSelfie}
          className="bg-blue-600 text-white px-6 py-3 rounded-md w-full max-w-md"
        >
          Take Selfie
        </button>
      ) : (
        <div className="flex gap-3 max-w-md">
          <button
            onClick={handleRetake}
            disabled={isSubmitting}
            className="border px-4 py-2 rounded w-full"
          >
            Retake
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded w-full text-white ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}
