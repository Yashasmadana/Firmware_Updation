import React from "react";
import { useNavigate } from "react-router-dom";

export default function FlashSummary() {
  const navigate = useNavigate();
  const summary = JSON.parse(localStorage.getItem("flashSummary"));

  if (!summary) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            No Flash Data Found
          </h2>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-3 bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = summary.result === "Successful";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">
            {isSuccess ? "✅" : "❌"}
          </div>
          <h1 className="text-3xl font-bold text-sky-400">
            Firmware Flash Summary
          </h1>
          <p className="text-slate-400 mt-2">
            Operation completed
          </p>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">

          <div className="bg-slate-800 p-4 rounded-lg flex justify-between">
            <span className="text-slate-400">Version</span>
            <span className="font-semibold text-sky-400">
              {summary.version}
            </span>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg flex justify-between">
            <span className="text-slate-400">Device</span>
            <span className="font-semibold">
              {summary.device}
            </span>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg flex justify-between">
            <span className="text-slate-400">Date</span>
            <span className="font-semibold">
              {summary.date}
            </span>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg flex justify-between">
            <span className="text-slate-400">Time</span>
            <span className="font-semibold">
              {summary.time}
            </span>
          </div>

          <div
            className={`p-4 rounded-lg text-center font-bold text-lg ${
              isSuccess
                ? "bg-green-600/20 text-green-400 border border-green-500"
                : "bg-red-600/20 text-red-400 border border-red-500"
            }`}
          >
            Flash Result: {summary.result}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold transition"
          >
            Flash Another
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("flashSummary");
              navigate("/");
            }}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}