"use client";
import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";

export default function ApiUsagePage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/api-usage?limit=200`);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching api usage logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity size={20} className="text-purple-400" /> API Usage Logs
                </h1>
                <button onClick={fetchLogs} disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            <div className="border border-white/5 rounded-lg overflow-x-auto bg-[#13141a]">
                <table className="w-full text-xs text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 text-gray-500 bg-[#16171f] whitespace-nowrap">
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Account</th>
                            <th className="px-4 py-3 font-semibold">API</th>
                            <th className="px-4 py-3 font-semibold">Operation</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Details</th>
                            <th className="px-4 py-3 font-semibold">Error</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                    No API usage logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                                    <td className="px-4 py-2 text-gray-400">{log.created_at}</td>
                                    <td className="px-4 py-2 text-gray-200 font-semibold">@{log.username}</td>
                                    <td className="px-4 py-2 text-gray-400">{log.api_name}</td>
                                    <td className="px-4 py-2 text-blue-400 font-medium">{log.operation}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            log.status === "SUCCESS" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-gray-400">
                                        {log.operation === "EXTRACT" && `Fetched: ${log.fetched_count} | Saved: ${log.saved_count} | Rejected: ${log.rejected_count}`}
                                        {log.operation === "POST" && `Posted: ${log.posted_count} | Rejected: ${log.rejected_count}`}
                                        {log.operation === "POST_NOW" && `Posted: ${log.posted_count} | Rejected: ${log.rejected_count}`}
                                    </td>
                                    <td className="px-4 py-2 text-red-400 max-w-xs truncate" title={log.error_message || ""}>
                                        {log.error_message || "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
