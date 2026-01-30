"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

export default function StudentSelfiePage() {
  const { classCode } = useParams();
  const videoRef = useRef(null);

  const [rollNumbers, setRollNumbers] = useState([]);
  const [newRoll, setNewRoll] = useState("");

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };

    startCamera();
  }, []);

  const addRollNumber = () => {
    if (!newRoll.trim()) return;
    if (rollNumbers.includes(newRoll)) return;

    setRollNumbers([...rollNumbers, newRoll]);
    setNewRoll("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Heading */}
      <h1 className="text-2xl font-bold text-black mb-4">
        Selfie Time – {classCode.toUpperCase()}
      </h1>

      {/* Camera Preview */}
      <div className="bg-black rounded-lg overflow-hidden w-full max-w-md mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-64 object-cover"
        />
      </div>

      {/* Add Roll Numbers */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            value={newRoll}
            onChange={(e) => setNewRoll(e.target.value)}
            placeholder="Enter roll no."
            className="border px-3 py-2 rounded w-full text-black"
          />
          <button
            onClick={addRollNumber}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Add +
          </button>
        </div>

        {rollNumbers.length > 0 && (
          <div className="text-sm text-black">
            Added roll numbers:{" "}
            <span className="font-mono">
              {rollNumbers.join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Take Selfie */}
      <button className="bg-blue-600 text-white px-6 py-3 rounded-md w-full max-w-md">
        Take Selfie
      </button>

      {/* Notes */}
      <p className="text-sm text-gray-600 mt-4 max-w-md">
        Note: One bench – one selfie. Add roll numbers of students
        sitting with you before taking selfie.
      </p>
    </div>
  );
}
