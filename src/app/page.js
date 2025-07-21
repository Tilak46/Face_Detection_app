"use client";

import FaceTracker from '@/components/FaceTracker';

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-950">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg tracking-tight text-center">
        👁️ Face Detection App
      </h1>
      <p className="text-lg text-gray-200 mb-10 text-center max-w-xl font-mono tracking-wide drop-shadow">
        Real-time face detection with a modern, beautiful UI. Your camera feed stays on your device.
      </p>
      <FaceTracker />
    </div>
  );
}
