"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Activity, XCircle, CheckCircle } from "lucide-react";
import { getAccounts } from "../../lib/api";

export default function LogsPage() {
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await getAccounts();
                setAccounts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("❌ Error fetching accounts:", error);
                setAccounts([]);
            }
        };

        const fetchLogs = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/logs`);
                if (!response.ok) throw new Error("Error fetching logs");
                const data = await response.json();
                setLogs(data);
            } catch (error) {
                console.error("❌ Error fetching logs:", error);
                setLogs([]);
            }
        };

        const fetchData = async () => {
            await fetchAccounts();
            await fetchLogs();
            setLoading(false);
        };

        fetchData();
    }, []);

    const formatDate = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toISOString().split("T")[0];
        } catch (error) {
            console.error("❌ Error formatting date:", timestamp, error);
            return "";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
            <header className="mb-12">
                <motion.h1
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent flex items-center gap-3"
                >
                    <MessageSquare size={36} className="text-purple-400" />
                    System Logs
                </motion.h1>
                <p className="text-gray-400 mt-2">Activity and error logs across all monitored accounts</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account, index) => {
                    const accountLogs = logs.filter((log) => log.user_id === account.id);
                    const today = new Date().toISOString().split("T")[0];

                    const postedToday = accountLogs.filter((log) => {
                        const logDate = formatDate(log.timestamp);
                        return log.event_type === "POST" && logDate === today;
                    }).length;

                    const totalPosted = accountLogs.filter((log) => log.event_type === "POST").length;
                    const failedPosts = accountLogs.filter((log) => log.event_type === "ERROR").length;

                    return (
                        <motion.div
                            key={account.username}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all cursor-default"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity" />
                            
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                @{account.username}
                            </h3>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Today</div>
                                    <div className="text-2xl font-bold text-white">{postedToday}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Total</div>
                                    <div className="text-2xl font-bold text-blue-400">{totalPosted}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Failed</div>
                                    <div className="text-2xl font-bold text-red-400">{failedPosts}</div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                
                {accounts.length === 0 && (
                    <div className="col-span-full glass-panel p-8 rounded-2xl text-center text-gray-400">
                        <Activity size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No accounts found in the system. Add an account to view logs.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
