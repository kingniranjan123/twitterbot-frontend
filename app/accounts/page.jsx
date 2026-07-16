"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Play, Square, Activity, MoreVertical, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [adding, setAdding] = useState(false);
    const [isCheckingAlive, setIsCheckingAlive] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts`);
                const data = await res.json();
                setAccounts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch accounts:", err);
            } finally {
                setLoading(false);
            }
        };

        const checkPostingStatus = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status-post`);
                const data = await response.json();
                setIsPosting(data.status === "running");
            } catch (error) {
                console.error("Failed to fetch posting status:", error);
            }
        };

        fetchAccounts();
        checkPostingStatus();
    }, []);

    const startStopPosting = async () => {
        const endpoint = isPosting ? '/stop-post' : '/start-post';
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, { method: 'POST' });
            if (response.ok) {
                const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status-post`); 
                const statusData = await statusResponse.json();
                setIsPosting(statusData.status === "running");
            }
        } catch (e) {
            console.error("Failed to toggle posting", e);
        }
    };

    const handleCheckAlive = async () => {
        setIsCheckingAlive(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/check-alive`, { method: 'POST' });
            if (res.ok) {
                const updatedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts`);
                const updatedData = await updatedRes.json();
                setAccounts(Array.isArray(updatedData) ? updatedData : []);
            } else {
                alert("Failed to check accounts alive status.");
            }
        } catch (err) {
            console.error("Error checking alive status", err);
        } finally {
            setIsCheckingAlive(false);
        }
    };

    const handleAddAccount = async (e) => {
        e.preventDefault();
        if (!newUsername) return;
        
        setAdding(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername.replace('@', '') })
            });
            if (res.ok) {
                const data = await res.json();
                // Refresh accounts
                const updatedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts`);
                const updatedData = await updatedRes.json();
                setAccounts(Array.isArray(updatedData) ? updatedData : []);
                setShowAddModal(false);
                setNewUsername("");
            } else {
                alert("Failed to add account");
            }
        } catch (err) {
            alert("Error adding account");
        } finally {
            setAdding(false);
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
        <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)] relative">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <motion.h1
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent flex items-center gap-3"
                    >
                        <Users size={36} className="text-purple-400" />
                        Account Management
                    </motion.h1>
                    <p className="text-gray-400 mt-2">Manage connected Twitter accounts and global automation</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleCheckAlive}
                        disabled={isCheckingAlive}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/50 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50"
                    >
                        {isCheckingAlive ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />} 
                        {isCheckingAlive ? "Checking..." : "ALIVE CHECK"}
                    </button>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg border border-white/10"
                    >
                        <Plus size={20} /> Add Account
                    </button>
                    
                    <button
                        onClick={startStopPosting}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg 
                            ${isPosting
                            ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 text-white shadow-green-500/20'
                          }`}
                    >
                        {isPosting ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        {isPosting ? "Stop Posting" : "Start Global Posting"}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {accounts.length === 0 ? (
                    <div className="col-span-full glass-panel p-12 rounded-2xl text-center text-gray-400">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">No Accounts Found</h3>
                        <p className="mb-6">Connect your first Twitter account to start automating.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                        >
                            Add Account
                        </button>
                    </div>
                ) : (
                    accounts.map((account, index) => (
                        <motion.div
                            key={account.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => router.push(`/account/${account.twitter_id}`)}
                            className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all cursor-pointer"
                        >
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 rounded-full blur-xl group-hover:opacity-30 transition-opacity" />
                            
                            <div className="flex items-start justify-between mb-4">
                                <img 
                                    src={account.profile_pic || "https://avatar.iran.liara.run/public/boy"} 
                                    alt="Profile" 
                                    className="w-16 h-16 rounded-full border-2 border-purple-500/30 object-cover"
                                />
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/tweets/${account.twitter_id}`);
                                    }}
                                    className="p-2 bg-white/5 hover:bg-purple-500/20 rounded-lg text-purple-300 transition-colors tooltip-trigger"
                                    title="View Generated Tweets"
                                >
                                    <Activity size={18} />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-white">@{account.username}</h3>
                                {account.session ? (
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" title="Connected"></span>
                                ) : (
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" title="Disconnected"></span>
                                )}
                            </div>
                            <p className="text-sm text-gray-400 mb-4 font-mono text-xs truncate">{account.twitter_id}</p>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                <div>
                                    <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Followers</div>
                                    <div className="font-bold text-gray-200">{account.followers || 0}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Posted</div>
                                    <div className="font-bold text-gray-200">{account.collected_tweets || 0}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel p-8 rounded-2xl max-w-md w-full border border-purple-500/30"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">Add New Account</h2>
                        <p className="text-gray-400 mb-6 text-sm">Enter the Twitter username you want to connect.</p>
                        
                        <form onSubmit={handleAddAccount}>
                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Twitter Username
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full bg-[#0a0a16] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adding || !newUsername}
                                    className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg disabled:opacity-50 transition-all"
                                >
                                    {adding ? "Adding..." : "Add Account"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
