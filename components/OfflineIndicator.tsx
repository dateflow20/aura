import React, { useState, useEffect } from 'react';

const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowOfflineMessage(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOfflineMessage(true);

            // Hide message after 5 seconds
            setTimeout(() => {
                setShowOfflineMessage(false);
            }, 5000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showOfflineMessage && isOnline) return null;

    return (
        <>
            {/* Persistent indicator when offline */}
            {!isOnline && (
                <div className="fixed top-20 left-0 right-0 z-[80] flex justify-center pointer-events-none">
                    <div className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 pointer-events-auto">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        <span>Offline Mode - Your data is saved locally</span>
                    </div>
                </div>
            )}

            {/* Toast notification when going online/offline */}
            {showOfflineMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-top-4 duration-300">
                    <div className={`px-6 py-4 rounded-[1.5rem] shadow-2xl border-2 ${isOnline
                            ? 'bg-green-500 border-green-400 text-white'
                            : 'bg-yellow-500 border-yellow-400 text-black'
                        }`}>
                        <div className="flex items-center gap-3">
                            {isOnline ? (
                                <>
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-black text-sm">Back Online!</p>
                                        <p className="text-xs opacity-90">Syncing your data...</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-black text-sm">You're Offline</p>
                                        <p className="text-xs opacity-90">Don't worry, all data is saved locally</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OfflineIndicator;
