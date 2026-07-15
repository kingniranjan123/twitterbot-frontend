"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Key } from "lucide-react";

export default function ApiKeysPage() {
    const [loading, setLoading] = useState(true);
    const [apiKeys, setApiKeys] = useState({ openrouter: "", rapidapi: "", twitterapi: "" });
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/api-keys`)
            .then((res) => res.json())
            .then((data) => setApiKeys(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    const handleInputChange = (e) => {
        setApiKeys({ ...apiKeys, [e.target.name]: e.target.value });
    };
    
    const saveApiKeys = () => {
        setIsFetching(true);
        setMessage("");
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/api-keys`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiKeys),
        })
            .then((res) => res.json())
            .then(() => setMessage("API Keys updated successfully!"))
            .catch(() => setMessage("Error updating API Keys"))
            .finally(() => setIsFetching(false));
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
                    <Key size={36} className="text-purple-400" />
                    API Keys Management
                </motion.h1>
                <p className="text-gray-400 mt-2">Configure your external API credentials</p>
            </header>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-4xl glass-panel p-8 rounded-2xl"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {Object.entries(apiKeys).map(([keyName, keyValue]) => (
                        <div key={keyName} className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {keyName} API KEY
                            </label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder={`Enter ${keyName} API Key`}
                                name={keyName}
                                value={keyValue || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                    ))}
                </div>
                
                <div className="flex flex-col items-start gap-4">
                    <button
                        onClick={saveApiKeys}
                        disabled={isFetching}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isFetching ? "Saving..." : "Save Configuration"}
                    </button>
                    
                    {message && (
                        <div className={`px-4 py-2 rounded-lg text-sm border ${message.includes("Error") ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
