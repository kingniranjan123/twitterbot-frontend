"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ChevronLeft, Settings, RefreshCw, Edit3, Save, 
    Upload, Download, ShieldCheck, CheckCircle2, XCircle, 
    Activity, User, Users, MessageSquare, Heart, Repeat2, Search, Zap, X
} from "lucide-react";

export default function AccountDetails() {
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const [twitterId, setTwitterId] = useState("");
    const [userInfo, setUserInfo] = useState({});
    
    // Arrays
    const [users, setUsers] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [likes, setLikes] = useState([]);
    const [comments, setComments] = useState([]);
    const [retweets, setRetweets] = useState([]);
    const [follows, setFollows] = useState([]);
    const [posts, setPosts] = useState(0);

    // Inputs
    const [userInput, setUserInput] = useState("");
    const [keywordInput, setKeywordInput] = useState("");
    const [commentInput, setCommentInput] = useState("");
    const [followInput, setFollowInput] = useState("");
    const [likeInput, setLikeInput] = useState("");
    const [retweetInput, setRetweetInput] = useState("");

    // Settings
    const [rateLimit, setRateLimit] = useState(0);  
    const [likesLimit, setLikesLimit] = useState(0);  
    const [followsLimit, setFollowsLimit] = useState(0);  
    const [commentsLimit, setCommentsLimit] = useState(0);  
    const [retweetsLimit, setRetweetsLimit] = useState(0);  
    const [extractionLimit, setExtractionLimit] = useState(100);
    const [extractionFilter, setExtractionFilter] = useState("cb1");
    const [selectedMethod, setSelectedMethod] = useState(1);
    const [customStyle, setCustomStyle] = useState(""); 
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [notes, setNotes] = useState("");
    const [languages, setLanguages] = useState([]);

    // States
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isVerifyingCategory, setIsVerifyingCategory] = useState(false);
    const [verifyMessage, setVerifyMessage] = useState("");
    
    // Edit Profile
    const [newUsername, setNewUsername] = useState("");
    const [newName, setNewName] = useState("");
    const [newProfilePic, setNewProfilePic] = useState("");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [editProfileError, setEditProfileError] = useState("");
    const [importFile, setImportFile] = useState(null);

    useEffect(() => {
        const pathSegments = pathname.split("/");
        const id = pathSegments[pathSegments.length - 1];
        setTwitterId(id);

        const fetchLanguages = async () => {
            try {
                const response = await fetch("https://restcountries.com/v3.1/all?fields=languages");
                const data = await response.json();
                const languageSet = new Set();
                data.forEach((country) => {
                    if (country.languages) {
                        Object.values(country.languages).forEach((lang) => languageSet.add(lang));
                    }
                });
                setLanguages([...languageSet].sort());
            } catch (error) {
                console.error("Error fetching languages:", error);
            }
        };

        const fetchUserThenRateLimit = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/${id}`);
                const data = await response.json();
    
                if (data.user) {
                    setUsers(data.monitored_users.map((mu) => mu.twitter_username));
                    setUserInfo(data.user);
                    setCustomStyle(data.user.custom_style || "");
                    setNotes(data.user.notes || "");
                    setSelectedLanguage(data.user.language || "English");
                    setKeywords(data.keywords || []);
                    setLikes(data.likes.map((l) => l.twitter_username));
                    setComments(data.comments.map((c) => c.twitter_username));
                    setRetweets(data.retweets.map((r) => r.twitter_username));
                    setFollows(data.follows.map((f) => f.twitter_username));
                    setPosts(data.posts_count || 0);
                    setExtractionFilter(data.user.extraction_filter || "cb1"); 
                    setLikesLimit(data.user.likes_limit || 0);
                    setCommentsLimit(data.user.comments_limit || 0);
                    setRetweetsLimit(data.user.retweets_limit || 0);
                    setFollowsLimit(data.user.follows_limit || 0);
                    setExtractionLimit(data.user.extraction_limit || 100);
                    setSelectedMethod(data.user.extraction_method || 1);

                    const rateResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/get_rate_limit?twitter_id=${id}`);
                    const rateData = await rateResp.json();
                    if (rateResp.ok && typeof rateData.rate_limit === "number") {
                        setRateLimit(rateData.rate_limit);
                    } else {
                        setRateLimit(10);
                    }
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            } finally {
                setLoading(false);
            }
        };
    
        fetchUserThenRateLimit();
        fetchLanguages();
    }, [pathname]);

    const handleRefreshProfile = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/${twitterId}/refresh-profile`, {
                method: "POST"
            });
            const data = await res.json();
            if (!res.ok) return alert("❌ Error refreshing profile: " + data.error);
    
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/${twitterId}`);
            const updatedData = await response.json();
            if (updatedData.user) setUserInfo(updatedData.user);
        } catch (err) {
            alert("❌ Error refreshing profile.");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSave = async () => {
        if (!rateLimit || rateLimit <= 0) return setSaveMessage({ type: 'error', text: "Rate limit must be > 0" });
        if (rateLimit > 10) return setSaveMessage({ type: 'error', text: "Rate limit must be <= 10" });
    
        setSaveMessage(null);
        setIsSaving(true); 

        const updatedData = {
            language: selectedLanguage, custom_style: customStyle, monitored_users: users,
            keywords: keywords, extraction_filter: extractionFilter, notes: notes,
            likes_limit: likesLimit, follows_limit: followsLimit, comments_limit: commentsLimit,
            retweets_limit: retweetsLimit, retweets: retweets, comments: comments,
            follows: follows, likes: likes, extraction_limit: extractionLimit,
            extraction_method: selectedMethod,
        };
    
        try {
            const res1 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/${twitterId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });
            if (!res1.ok) return setSaveMessage({ type: 'error', text: "Error updating account" });
    
            const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/update_rate_limit`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ twitter_id: twitterId, rate_limit: parseInt(rateLimit) })
            });
            if (!res2.ok) return setSaveMessage({ type: 'error', text: "Error updating rate limit" });
    
            setSaveMessage({ type: 'success', text: "Changes saved successfully!" });
        } catch (error) {
            setSaveMessage({ type: 'error', text: "Unexpected error occurred." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerifyCategory = async () => {
        setIsVerifyingCategory(true);
        setVerifyMessage(""); 
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/${twitterId}/verify-category`, { method: "POST" });
            const data = await res.json();
            if (!res.ok || !data.result) return setVerifyMessage(data?.error || "❌ Error verifying category.");
            setUserInfo(prev => ({ ...prev, verified: data.result }));
            setVerifyMessage("✅ Category verification completed.");
        } catch (err) {
            setVerifyMessage("❌ Unexpected error.");
        } finally {
            setIsVerifyingCategory(false);
        }
    };

    const handleOpenEditProfile = () => {
        setNewUsername(userInfo.username || "");
        setNewName(userInfo.name || "");
        setNewProfilePic(userInfo.profile_pic || "");
        setShowEditProfile(true);
    };

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        setEditProfileError("");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/${twitterId}/update-profile`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: newUsername, profile_pic: newProfilePic, name: newName }),
            });
            const data = await res.json();
            if (!res.ok) {
                setEditProfileError(data.error || "Unknown error updating profile");
                setIsUpdatingProfile(false);
                return;
            }
            setUserInfo({ ...userInfo, username: newUsername, profile_pic: newProfilePic, name: newName });
            setShowEditProfile(false);
        } catch (err) {
            setEditProfileError("Unknown error updating profile");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // Export/Import
    const handleExportData = () => {
        const rows = [["type", "value"]];
        users.forEach(u => rows.push(["user", u]));
        keywords.forEach(k => rows.push(["keyword", k]));
        likes.forEach(l => rows.push(["like", l]));
        comments.forEach(c => rows.push(["comment", c]));
        retweets.forEach(r => rows.push(["retweet", r]));
        follows.forEach(f => rows.push(["follow", f]));
        rows.push(["custom_style", customStyle]);
        rows.push(["language", selectedLanguage]);
        rows.push(["extraction_filter", extractionFilter]);
        rows.push(["rate_limit", rateLimit]);
        rows.push(["extraction_limit", extractionLimit]);
        rows.push(["likes_limit", likesLimit]);
        rows.push(["comments_limit", commentsLimit]);
        rows.push(["retweets_limit", retweetsLimit]);
        rows.push(["follows_limit", followsLimit]);

        const csvContent = rows.map(e => e.join(";")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `export_${userInfo.username}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportData = () => {
        if (!importFile) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = event.target.result.split("\n").map(l => l.trim());
            const newUsers = [...users], newKeywords = [...keywords], newLikes = [...likes];
            const newComments = [...comments], newRetweets = [...retweets], newFollows = [...follows];

            lines.slice(1).forEach(line => {
                const [type, value] = line.split(";").map(s => s.trim());
                if (!type || !value) return;
                switch (type) {
                    case "user": if (!newUsers.includes(value)) newUsers.push(value); break;
                    case "keyword": if (!newKeywords.includes(value)) newKeywords.push(value); break;
                    case "like": if (!newLikes.includes(value)) newLikes.push(value); break;
                    case "comment": if (!newComments.includes(value)) newComments.push(value); break;
                    case "retweet": if (!newRetweets.includes(value)) newRetweets.push(value); break;
                    case "follow": if (!newFollows.includes(value)) newFollows.push(value); break;
                    case "custom_style": setCustomStyle(value); break;
                    case "language": setSelectedLanguage(value); break;
                    case "extraction_filter": setExtractionFilter(value); break;
                    case "rate_limit": setRateLimit(value); break;
                    case "likes_limit": setLikesLimit(value); break;
                    case "follows_limit": setFollowsLimit(value); break;
                    case "comments_limit": setCommentsLimit(value); break;
                    case "retweets_limit": setRetweetsLimit(value); break;
                }
            });
            setUsers(newUsers); setKeywords(newKeywords); setLikes(newLikes);
            setComments(newComments); setRetweets(newRetweets); setFollows(newFollows);
            setShowSettings(false);
        };
        reader.readAsText(importFile);
    };

    // Array mutators
    const addToArray = (e, val, setVal, arr, setArr) => {
        if (e.key === "Enter" && val.trim() !== "") {
            if (!arr.includes(val.trim())) setArr([...arr, val.trim()]);
            setVal("");
        }
    };
    const removeFromArray = (index, arr, setArr) => setArr(arr.filter((_, i) => i !== index));

    if (loading) return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-8 text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
    );

    const isConnected = !!userInfo.session;

    return (
        <div className="min-h-screen bg-[var(--background)] p-8 text-[var(--foreground)] relative">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <button onClick={() => router.push('/accounts')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Accounts
                    </button>
                    <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent flex items-center gap-3">
                        @{userInfo.username} Configuration
                    </motion.h1>
                </div>
                
                <div className="flex gap-4">
                    <button onClick={handleRefreshProfile} disabled={isRefreshing} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10">
                        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} /> Refresh Profile
                    </button>
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10">
                        <Settings size={18} /> Advanced Settings
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg transition-all">
                        {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
                    </button>
                </div>
            </header>

            {saveMessage && (
                <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 border ${saveMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {saveMessage.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    {saveMessage.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile & Engagement */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Profile Card */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-6 rounded-2xl relative overflow-hidden group border border-purple-500/30">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 rounded-full blur-2xl" />
                        
                        {/* Connection Badge */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-black/40 border backdrop-blur-md">
                            {isConnected ? (
                                <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div><span className="text-green-400">Connected</span></>
                            ) : (
                                <><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div><span className="text-red-400">Disconnected</span></>
                            )}
                        </div>

                        <div className="flex flex-col items-center text-center mt-4">
                            <div className="relative mb-4 group cursor-pointer" onClick={handleOpenEditProfile}>
                                <img src={userInfo.profile_pic || "https://avatar.iran.liara.run/public/boy"} alt="Profile" className="w-24 h-24 rounded-full border-2 border-purple-500/50 object-cover" />
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit3 size={24} className="text-white" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                {userInfo.name}
                                {userInfo.verified === "1" && <ShieldCheck size={20} className="text-blue-400" />}
                            </h2>
                            <p className="text-gray-400 font-mono text-sm mb-6">@{userInfo.username}</p>

                            <div className="grid grid-cols-3 gap-4 w-full border-t border-white/10 pt-6">
                                <div><div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Followers</div><div className="font-bold text-white text-lg">{userInfo.followers || 0}</div></div>
                                <div><div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Following</div><div className="font-bold text-white text-lg">{userInfo.following || 0}</div></div>
                                <div><div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">Posts</div><div className="font-bold text-purple-400 text-lg cursor-pointer hover:text-purple-300" onClick={() => router.push(`/posted-tweets/${userInfo.id}`)}>{posts}</div></div>
                            </div>

                            <div className="w-full mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-400">AI Trust Score</span>
                                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{userInfo.ai_score}/100</span>
                                </div>
                                <div className="w-full bg-black/40 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: `${userInfo.ai_score}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Limits Card */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Zap size={18} className="text-yellow-400"/> Rate Limits (per hour)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: "Posts", val: rateLimit, set: setRateLimit },
                                { label: "Likes", val: likesLimit, set: setLikesLimit },
                                { label: "Comments", val: commentsLimit, set: setCommentsLimit },
                                { label: "Retweets", val: retweetsLimit, set: setRetweetsLimit },
                                { label: "Follows", val: followsLimit, set: setFollowsLimit },
                                { label: "Extraction", val: extractionLimit, set: setExtractionLimit }
                            ].map((limit, idx) => (
                                <div key={idx} className="bg-black/30 rounded-xl p-3 border border-white/5">
                                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2">{limit.label}</label>
                                    <input type="number" min="0" max="10" value={limit.val} onChange={e => limit.set(e.target.value)} className="w-full bg-transparent text-white font-bold text-lg focus:outline-none focus:border-b border-purple-500 pb-1 text-center"/>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Automations */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Monitored Accounts & Keywords */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Users */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Users size={18} className="text-blue-400"/> Source Accounts</h3>
                            <input 
                                type="text" placeholder="Add @username and press Enter" 
                                value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => addToArray(e, userInput, setUserInput, users, setUsers)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 mb-4"
                            />
                            <div className="flex flex-wrap gap-2">
                                {users.map((u, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-medium">
                                        @{u} <button onClick={() => removeFromArray(i, users, setUsers)} className="hover:text-white"><X size={12}/></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Keywords */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Search size={18} className="text-green-400"/> Monitor Keywords</h3>
                            <input 
                                type="text" placeholder="Add keyword and press Enter" 
                                value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => addToArray(e, keywordInput, setKeywordInput, keywords, setKeywords)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 mb-4"
                            />
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((k, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full text-xs font-medium">
                                        {k} <button onClick={() => removeFromArray(i, keywords, setKeywords)} className="hover:text-white"><X size={12}/></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Engagement Automations */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Targeted Engagements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "Auto-Like", icon: <Heart size={16} className="text-pink-400"/>, val: likeInput, setVal: setLikeInput, arr: likes, setArr: setLikes, color: "pink" },
                                { title: "Auto-Retweet", icon: <Repeat2 size={16} className="text-emerald-400"/>, val: retweetInput, setVal: setRetweetInput, arr: retweets, setArr: setRetweets, color: "emerald" },
                                { title: "Auto-Reply", icon: <MessageSquare size={16} className="text-blue-400"/>, val: commentInput, setVal: setCommentInput, arr: comments, setArr: setComments, color: "blue" },
                                { title: "Auto-Follow", icon: <User size={16} className="text-purple-400"/>, val: followInput, setVal: setFollowInput, arr: follows, setArr: setFollows, color: "purple" }
                            ].map((eng, idx) => (
                                <div key={idx} className="bg-black/20 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">{eng.icon} {eng.title}</h4>
                                    <input 
                                        type="text" placeholder={`Add @username...`} 
                                        value={eng.val} onChange={e => eng.setVal(e.target.value)} onKeyDown={e => addToArray(e, eng.val, eng.setVal, eng.arr, eng.setArr)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 mb-3"
                                    />
                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                                        {eng.arr.map((item, i) => (
                                            <span key={i} className={`flex items-center gap-1 bg-${eng.color}-500/20 text-${eng.color}-300 border border-${eng.color}-500/30 px-2 py-1 rounded text-[10px] font-medium`}>
                                                @{item} <button onClick={() => removeFromArray(i, eng.arr, eng.setArr)} className="hover:text-white"><X size={10}/></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Configuration */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">AI Configuration</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Custom Persona Instructions</label>
                                <textarea 
                                    rows="3" value={customStyle} onChange={e => setCustomStyle(e.target.value)}
                                    placeholder="e.g. Write in a sarcastic tone. Use emojis heavily..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Extraction Filter</label>
                                    <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
                                        {[
                                            { id: 'cb1', label: 'All Tweets' },
                                            { id: 'cb2', label: 'Image Only' },
                                            { id: 'cb3', label: 'Video Only' },
                                            { id: 'cb4', label: 'Image and Video' }
                                        ].map(({ id, label }) => (
                                            <label key={id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                <input type="radio" name="filter" value={id} checked={extractionFilter === id} onChange={e => setExtractionFilter(e.target.value)} className="accent-purple-500"/>
                                                <span className="text-sm text-gray-300">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Processing Strategy</label>
                                    <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
                                        {[1, 2].map((num) => (
                                            <label key={num} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                <input type="radio" name="method" value={num} checked={selectedMethod === num} onChange={e => setSelectedMethod(Number(e.target.value))} className="accent-purple-500"/>
                                                <span className="text-sm text-gray-300">{num === 1 ? "Selective Translation (Intelligent)" : "Replicative (Direct Copy)"}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlays (Modals) */}
            <AnimatePresence>
                {showEditProfile && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-panel p-8 rounded-2xl max-w-md w-full border border-purple-500/30">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                                <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                            </div>
                            
                            <div className="flex justify-center mb-6">
                                <div className="relative group">
                                    <img src={newProfilePic || "https://avatar.iran.liara.run/public/boy"} alt="Profile" className="w-24 h-24 rounded-full border-2 border-purple-500/50 object-cover" />
                                    <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setNewProfilePic(reader.result.toString());
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                        <Upload size={20} className="text-white" />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Name</label>
                                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-[#0a0a16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                                        <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full bg-[#0a0a16] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                                    </div>
                                </div>
                            </div>

                            {editProfileError && <div className="mt-4 p-3 bg-red-500/20 text-red-400 text-sm rounded-xl border border-red-500/30 text-center">{editProfileError}</div>}

                            <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full mt-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                                {isUpdatingProfile ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18}/>}
                                Update Profile
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {showSettings && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-panel p-8 rounded-2xl max-w-md w-full border border-purple-500/30 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Advanced Settings</h2>
                                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Output Language</label>
                                    <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="w-full bg-[#0a0a16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                                        <option value="">Default (English)</option>
                                        {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Private Notes</label>
                                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-[#0a0a16] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" placeholder="Internal notes for this account..." />
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h4 className="text-sm font-bold text-white mb-4">Data Management</h4>
                                    <button onClick={handleExportData} className="w-full mb-3 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex justify-center items-center gap-2">
                                        <Download size={18}/> Export CSV
                                    </button>
                                    
                                    <div className="relative">
                                        <input type="file" accept=".csv" onChange={e => setImportFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <button className="w-full py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex justify-center items-center gap-2 border border-dashed border-white/30">
                                            <Upload size={18}/> {importFile ? importFile.name : "Select CSV to Import"}
                                        </button>
                                    </div>
                                    {importFile && (
                                        <button onClick={handleImportData} className="w-full mt-3 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all">
                                            Execute Import
                                        </button>
                                    )}
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <button onClick={handleVerifyCategory} disabled={isVerifyingCategory} className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                                        {isVerifyingCategory ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18}/>} Verify Category
                                    </button>
                                    {verifyMessage && <div className={`mt-3 p-3 text-sm rounded-xl text-center border ${verifyMessage.includes('✅') ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{verifyMessage}</div>}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
