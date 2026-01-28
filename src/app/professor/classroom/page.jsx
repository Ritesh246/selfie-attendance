"use client";

import { useState } from "react";

export default function ProfessorClassroomPage() {
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState(generateClassCode());

  function generateClassCode() {
    return Math.random().toString(36).substring(2, 7);
  }

  function openModal() {
    setClassName("");
    setClassCode(generateClassCode());
    setShowModal(true);
  }

  function createClass() {
    if (!className.trim()) return;

    setClasses((prev) => [
      ...prev,
      { name: className, code: classCode },
    ]);

    setShowModal(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 bg-white shadow">
        <h1 className="text-lg sm:text-2xl font-semibold">
          Professor Classroom
        </h1>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm sm:text-base hover:bg-blue-700 transition"
        >
          Create a class
        </button>
      </div>

      {/* Classroom Grid */}
      <div className="p-4 sm:p-8">
        {classes.length === 0 ? (
          <p className="text-center text-gray-500 mt-20">
            No classes created yet
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((cls, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <h2 className="text-xl font-semibold mb-2">{cls.name}</h2>
                <p className="text-gray-600">
                  Class Code: <span className="font-mono">{cls.code}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Create a new class
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Class Name
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. IOT"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Class Code
              </label>
              <input
                type="text"
                value={classCode}
                readOnly
                className="w-full border rounded-md px-3 py-2 bg-gray-100 font-mono"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={createClass}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
