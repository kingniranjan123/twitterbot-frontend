"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChartLine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function UsagesPage() {
    const [loading, setLoading] = useState(true);
    const [usageStats, setUsageStats] = useState({
        openrouter: [],
        rapidapi: [],
        "twitterapi.io": []
    });

    useEffect(() => {
        const fetchUsageData = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usage/requests-per-day`);
                const data = await res.json();

                const getChartData = (apiKey) => {
                    const days = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        const key = date.toISOString().split("T")[0];
                        return {
                            day: `${date.getMonth() + 1}/${date.getDate()}`,
                            usage: data[key]?.[apiKey.toUpperCase()] || 0
                        };
                    });
                    return days;
                };

                setUsageStats({
                    openrouter: getChartData("openrouter"),
                    rapidapi: getChartData("rapidapi"),
                    "twitterapi.io": getChartData("twitterapi.io")
                });
            } catch (err) {
                console.error("Error fetching usage stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsageData();
    }, []);

    const renderChart = (title, data, color) => (
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel p-6 rounded-2xl relative overflow-hidden group mb-6"
        >
            <div className={`absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-full blur-2xl`} />
            <h3 className="text-xl font-bold mb-6 text-white">{title}</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="day" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="usage" fill="url(#colorUv)" radius={[4, 4, 0, 0]} barSize={32} />
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );

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
                    <ChartLine size={36} className="text-purple-400" />
                    API Usage Metrics
                </motion.h1>
                <p className="text-gray-400 mt-2">Track your API request volume over the last 7 days</p>
            </header>

            <div className="max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderChart("OpenRouter Requests", usageStats.openrouter, "from-purple-500 to-pink-500")}
                    {renderChart("Twitter API Requests", usageStats["twitterapi.io"], "from-blue-500 to-cyan-500")}
                </div>
                <div className="mt-6 max-w-3xl">
                    {renderChart("RapidAPI Requests", usageStats.rapidapi, "from-orange-500 to-red-500")}
                </div>
            </div>
        </div>
    );
}
