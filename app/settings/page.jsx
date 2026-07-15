"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Save, Bot, Key, Terminal } from 'lucide-react';

export default function SettingsPage() {
    const [prompts, setPrompts] = useState({
        TRANSLATE: '',
        GENERATE_POST: '',
        GENERATE_REPLY: '',
        CHECK_DUPLICATE: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        async function loadSettings() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                try {
                    // Fetch current config from backend
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/openai-config?user_id=${user.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setPrompts(prev => ({ ...prev, ...data }));
                    }
                } catch (error) {
                    console.error("Failed to load settings", error);
                }
            }
            setLoading(false);
        }
        loadSettings();
    }, []);

    const handleSave = async (type) => {
        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/openai-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    prompt_type: type,
                    prompt_text: prompts[type]
                })
            });
            if (!res.ok) throw new Error("Failed to save");
            alert("Settings saved!");
        } catch (e) {
            alert("Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading neural configurations...</div>;

    const sections = [
        { title: "Transformation Engine (Translation)", icon: <Terminal size={18} />, key: "TRANSLATE", desc: "System prompt for translating tweets." },
        { title: "Content Generator (Posts)", icon: <Bot size={18} />, key: "GENERATE_POST", desc: "Instruction for creating new posts from base text." },
        { title: "Reply Synthesis", icon: <Bot size={18} />, key: "GENERATE_REPLY", desc: "Persona definition for replying to tweets." },
        { title: "Duplicate Detection", icon: <Key size={18} />, key: "CHECK_DUPLICATE", desc: "Rules for detecting duplicate content." }
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)]">
            <header className="mb-10">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
                    Neural Configuration
                </h1>
                <p className="text-gray-400">Fine-tune the AI personas and system behavior.</p>
            </header>

            <div className="grid gap-8 max-w-4xl mx-auto">
                {sections.map((section, idx) => (
                    <motion.div
                        key={section.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-panel p-6 rounded-xl hover:border-purple-500/50 transition-colors"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3 text-xl font-semibold text-purple-300">
                                {section.icon}
                                <h2>{section.title}</h2>
                            </div>
                            <button
                                onClick={() => handleSave(section.key)}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all"
                            >
                                <Save size={16} /> Save
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{section.desc}</p>
                        <textarea
                            className="w-full h-40 bg-[#0a0a16] border border-gray-800 rounded-lg p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-purple-500 transition-colors resize-y"
                            value={prompts[section.key]}
                            onChange={(e) => setPrompts({ ...prompts, [section.key]: e.target.value })}
                            placeholder="Enter system prompt..."
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
