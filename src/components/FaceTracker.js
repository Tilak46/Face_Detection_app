"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recordCanvasRef = useRef(null);

  const [faceCount, setFaceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    };
    loadModels();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setLoading(false);
            detectFaces();
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    const detectFaces = () => {
      const video = videoRef.current;
      const overlayCanvas = canvasRef.current;
      const recordCanvas = recordCanvasRef.current;

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };

      faceapi.matchDimensions(overlayCanvas, displaySize);
      faceapi.matchDimensions(recordCanvas, displaySize);

      overlayCanvas.width = displaySize.width;
      overlayCanvas.height = displaySize.height;
      recordCanvas.width = displaySize.width;
      recordCanvas.height = displaySize.height;

      const overlayCtx = overlayCanvas.getContext("2d");
      const recordCtx = recordCanvas.getContext("2d");

      const loop = async () => {
        if (video.readyState === 4) {
          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions()
          );

          setFaceCount(detections.length);

          const resized = faceapi.resizeResults(detections, displaySize);

          // Clear both canvases
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          recordCtx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);

          // Draw video frame on recording canvas
          recordCtx.drawImage(video, 0, 0, recordCanvas.width, recordCanvas.height);

          // Draw face boxes on both canvases
          resized.forEach(({ box }) => {
            // Live overlay
            overlayCtx.strokeStyle = "#00ff88";
            overlayCtx.lineWidth = 2;
            overlayCtx.strokeRect(box.x, box.y, box.width, box.height);

            // Recording overlay
            recordCtx.strokeStyle = "#00ff88";
            recordCtx.lineWidth = 2;
            recordCtx.strokeRect(box.x, box.y, box.width, box.height);
          });
        }

        requestAnimationFrame(loop);
      };

      loop();
    };

    startCamera();
  }, []);

  const startRecording = () => {
    const stream = recordCanvasRef.current.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    recordedChunks.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `face-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="relative w-full max-w-2xl aspect-video mx-auto rounded-2xl overflow-hidden shadow-xl border-[6px] border-blue-500 bg-black/20 backdrop-blur-md ring-2 ring-blue-400">

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-white"></div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      <canvas ref={recordCanvasRef} className="hidden" />

      <div className="absolute top-3 left-3 bg-blue-700 text-white px-4 py-1 rounded-full text-sm shadow-md font-semibold z-20">
        👤 {faceCount} face{faceCount !== 1 && "s"} detected
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        {!recording ? (
          <button
            onClick={startRecording}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition"
          >
            🎥 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition"
          >
            ⏹ Stop Recording
          </button>
        )}
      </div>
    </div>
  );
}
