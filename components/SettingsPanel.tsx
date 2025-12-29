import React, { useState } from 'react';
import { GTDSettings, UserProfile, GTDTheme, GTDVoice, EyeColor } from '../types';

interface SettingsPanelProps {
    onClose: () => void;
    settings: GTDSettings;
    onSettingsUpdate: (settings: GTDSettings) => void;
    user: UserProfile | null;
    onSignOut: () => void;
}

const THEMES: { value: GTDTheme; label: string; preview: string }[] = [
    { value: 'venom', label: 'Venom', preview: 'bg-zinc-800 border-zinc-700' },
    { value: 'neural-blue', label: 'Neural Blue', preview: 'bg-blue-600 border-blue-500' },
    { value: 'solar-gold', label: 'Solar Gold', preview: 'bg-amber-500 border-amber-400' },
    { value: 'pure-white', label: 'Pure White', preview: 'bg-zinc-100 border-zinc-300' },
    { value: 'deep-purple', label: 'Deep Purple', preview: 'bg-purple-600 border-purple-500' },
    { value: 'emerald-green', label: 'Emerald', preview: 'bg-emerald-600 border-emerald-500' },
    { value: 'crimson-red', label: 'Crimson', preview: 'bg-red-600 border-red-500' },
    { value: 'cosmic', label: 'Cosmic', preview: 'bg-indigo-600 border-indigo-500' },
];

const VOICES: GTDVoice[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
const EYE_COLORS: { value: EyeColor; label: string; color: string }[] = [
    { value: 'white', label: 'White', color: 'bg-white' },
    { value: 'blue', label: 'Blue', color: 'bg-blue-400' },
    { value: 'gold', label: 'Gold', color: 'bg-amber-400' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-400' },
    { value: 'green', label: 'Green', color: 'bg-emerald-400' },
    { value: 'red', label: 'Red', color: 'bg-red-500' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, settings, onSettingsUpdate, user, onSignOut }) => {
    const [activeTab, setActiveTab] = useState<'appearance' | 'voice' | 'account'>('appearance');

    const updateSetting = <K extends keyof GTDSettings>(key: K, value: GTDSettings[K]) => {
        onSettingsUpdate({ ...settings, [key]: value });
    };

    const handleSignOut = () => {
        if (confirm('Are you sure you want to sign out? Your data will remain saved locally.')) {
            onSignOut();
            onClose();
        }
    };

    const isDark = settings.theme !== 'pure-white';

    return (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`w-full max-w-2xl ${isDark ? 'bg-zinc-900' : 'bg-white'} rounded-[2.5rem] border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} overflow-hidden shadow-2xl`}>
                {/* Header */}
                <div className={`p-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-between`}>
                    <div>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                            System Settings
                        </h2>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'} mt-1`}>
                            Configure GTD Neural Interface
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-3 rounded-full ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'} transition-all`}
                    >
                        <svg className={`w-6 h-6 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={`flex border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} px-6`}>
                    {[
                        { id: 'appearance', label: 'Appearance', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
                        { id: 'voice', label: 'Voice & Audio', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
                        { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-3 font-black text-xs uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id
                                ? isDark ? 'border-white text-white' : 'border-black text-black'
                                : isDark ? 'border-transparent text-zinc-600 hover:text-zinc-400' : 'border-transparent text-zinc-400 hover:text-zinc-600'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeWidth={2} d={tab.icon} />
                                </svg>
                                {tab.label}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            {/* Theme Selection */}
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-600'} mb-3`}>
                                    Theme
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {THEMES.map(theme => (
                                        <button
                                            key={theme.value}
                                            onClick={() => updateSetting('theme', theme.value)}
                                            className={`p-4 rounded-[1.5rem] border-2 transition-all ${settings.theme === theme.value
                                                ? 'border-white scale-105'
                                                : isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-200 hover:border-zinc-300'
                                                }`}
                                        >
                                            <div className={`w-full h-12 rounded-xl ${theme.preview} mb-2`} />
                                            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>{theme.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Eye Color */}
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-600'} mb-3`}>
                                    Neural Eye Color
                                </label>
                                <div className="flex gap-2">
                                    {EYE_COLORS.map(eye => (
                                        <button
                                            key={eye.value}
                                            onClick={() => updateSetting('eyeColor', eye.value)}
                                            className={`w-12 h-12 rounded-full border-2 transition-all ${settings.eyeColor === eye.value
                                                ? 'border-white scale-110'
                                                : isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-300 hover:border-zinc-400'
                                                }`}
                                            title={eye.label}
                                        >
                                            <div className={`w-full h-full rounded-full ${eye.color} shadow-lg`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'voice' && (
                        <div className="space-y-6">
                            {/* Voice Selection */}
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-600'} mb-3`}>
                                    Voice Signature
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {VOICES.map(voice => (
                                        <button
                                            key={voice}
                                            onClick={() => updateSetting('voice', voice)}
                                            className={`p-4 rounded-[1.5rem] border-2 transition-all ${settings.voice === voice
                                                ? 'border-white bg-white/5'
                                                : isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-200 hover:border-zinc-300'
                                                }`}
                                        >
                                            <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-black'}`}>{voice}</p>
                                            <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-500'}`}>
                                                Neural Voice
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Noise Suppression */}
                            <div className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-between`}>
                                <div>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Noise Suppression</p>
                                    <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-500'} mt-1`}>
                                        Filter background noise during voice recording
                                    </p>
                                </div>
                                <button
                                    onClick={() => updateSetting('noiseSuppression', !settings.noiseSuppression)}
                                    className={`w-14 h-8 rounded-full transition-all ${settings.noiseSuppression ? 'bg-blue-500' : isDark ? 'bg-zinc-800' : 'bg-zinc-300'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.noiseSuppression ? 'translate-x-7' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            {/* Learning Mode */}
                            <div className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-between`}>
                                <div>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Adaptive Learning</p>
                                    <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-500'} mt-1`}>
                                        Learn from your patterns to improve suggestions
                                    </p>
                                </div>
                                <button
                                    onClick={() => updateSetting('learningEnabled', !settings.learningEnabled)}
                                    className={`w-14 h-8 rounded-full transition-all ${settings.learningEnabled ? 'bg-blue-500' : isDark ? 'bg-zinc-800' : 'bg-zinc-300'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full bg-white transition-transform ${settings.learningEnabled ? 'translate-x-7' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            {/* User Info */}
                            <div className={`p-6 rounded-[1.5rem] border ${isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center font-black text-2xl`}>
                                        {user?.name?.charAt(0).toUpperCase() || 'G'}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-black text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                                            {user?.name || 'Guest User'}
                                        </p>
                                        <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                                            {user?.email || 'guest@gtd.local'}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-500'} mt-1`}>
                                            Focus: {user?.focusArea || 'General Productivity'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Account Actions */}
                            <div className="space-y-3">
                                {user?.email === 'guest@gtd.local' ? (
                                    <div className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-yellow-500/20 bg-yellow-500/10' : 'border-yellow-300 bg-yellow-50'}`}>
                                        <p className={`text-sm font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                                            💡 You're using Guest Mode
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-yellow-500/70' : 'text-yellow-600'} mt-1`}>
                                            Data is saved locally. Create an account to sync across devices.
                                        </p>
                                    </div>
                                ) : (
                                    <div className={`p-4 rounded-[1.5rem] border ${isDark ? 'border-green-500/20 bg-green-500/10' : 'border-green-300 bg-green-50'}`}>
                                        <p className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                                            ✓ Cloud Sync Active
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-green-500/70' : 'text-green-600'} mt-1`}>
                                            Your data syncs across all your devices
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleSignOut}
                                    className={`w-full py-4 rounded-[1.5rem] border-2 font-black text-sm uppercase tracking-wider transition-all ${isDark
                                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                        : 'border-red-300 text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
