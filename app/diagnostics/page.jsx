"use client";
import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/Sidebar";

export default function DiagnosticsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [runId, setRunId] = useState(null);
  const logsEndRef = useRef(null);

  const startTests = async () => {
    setIsRunning(true);
    setLogs([]);
    setRunId(null);
    try {
      const res = await fetch("https://twitterbot-backend-production.up.railway.app/api/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_name: "test_system" }),
      });
      const data = await res.json();
      if (data.run_id) {
        setRunId(data.run_id);
      } else {
        setLogs(["Error starting tests: " + JSON.stringify(data)]);
        setIsRunning(false);
      }
    } catch (err) {
      setLogs(["Failed to start tests: " + err.message]);
      setIsRunning(false);
    }
  };

  useEffect(() => {
    let interval;
    if (runId && isRunning) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`https://twitterbot-backend-production.up.railway.app/api/tests/logs/${runId}`);
          if (res.ok) {
            const data = await res.json();
            setLogs(data.logs || []);
            if (data.status === "completed" || data.status === "failed") {
              setIsRunning(false);
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error("Failed to fetch logs", err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [runId, isRunning]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex h-screen bg-[#0F0F13] text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col p-8 ml-64 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-2">System Diagnostics</h1>
        <p className="text-gray-400 mb-6">Run automated end-to-end tests to verify system health.</p>

        <div className="mb-6">
          <button 
            onClick={startTests} 
            disabled={isRunning}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-white font-semibold transition-colors"
          >
            {isRunning ? "Running Tests..." : "Run System Tests"}
          </button>
        </div>

        <div className="flex-1 bg-black rounded-lg border border-gray-800 p-4 font-mono text-sm overflow-y-auto shadow-inner h-[500px]">
          {logs.length === 0 && !isRunning && (
            <div className="text-gray-500 italic">Click the button above to start tests. Logs will appear here.</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="mb-1 text-green-400">
              <span className="text-gray-500 mr-2">{'>'}</span>{log}
            </div>
          ))}
          {isRunning && (
            <div className="animate-pulse text-yellow-400 mt-2">Running...</div>
          )}
          <div ref={logsEndRef} />
        </div>
      </main>
    </div>
  );
}
