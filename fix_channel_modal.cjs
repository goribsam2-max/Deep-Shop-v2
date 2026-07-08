const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

const target = `                     {/* Back Header */}
                     <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
                         <button 
                             onClick={() => setShowChannelDetailsModal(false)}
                             className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition"
                         >
                             <ArrowLeft className="w-6 h-6" />
                         </button>
                         <h2 className="text-lg font-bold">Channel Profile</h2>
                     </div>
                     <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full">
                         {/* Cover Banner Image */}
                         <div className="h-48 sm:h-64 w-full relative rounded-3xl overflow-hidden mb-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                           <img src={activeChannel.imageUrl} alt="Channel cover" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                             <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">Verified Community</span>
                             <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">{activeChannel.name}</h3>
                             <p className="text-sm text-white/80 font-bold mt-0.5">@{activeChannel.customLink}</p>
                           </div>
                         </div>
                         <div className="mb-8">
                           <h5 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Description</h5>
                           <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                             {activeChannel.description || "Welcome to our exclusive product broadcast channel. Join for periodic updates, visual arrivals, and direct chat links!"}
                           </p>
                         </div>
                         {/* Stats */}
                         <div className="grid grid-cols-2 gap-4 mb-8">
                           <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-center border border-zinc-100 dark:border-zinc-800">
                             <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Subscribers</p>
                             <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeChannel.subscriberCount || 1}</p>
                           </div>
                           <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-center border border-zinc-100 dark:border-zinc-800">
                             <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">Creator</p>
                             <p className="text-sm sm:text-base font-black text-[#EF8020] truncate mt-1.5">{activeChannel.creatorName || "Verified Seller"}</p>
                           </div>
                         </div>
                         {/* Unsubscribe / Mute / Action Buttons */}
                         <div className="space-y-3">
                           {userSubscription ? (
                             <>
                               <button 
                                 type="button"
                                 onClick={() => handleToggleMuteChannel(activeChannel, userSubscription.muted)}
                                 className="w-full py-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
                               >
                                 {userSubscription.muted ? <Volume2 className="w-5 h-5 text-emerald-500" /> : <VolumeX className="w-5 h-5 text-rose-500" />}
                                 <span>{userSubscription.muted ? "Unmute Channel Broadcasts" : "Mute Notifications"}</span>
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => {
                                   handleUnsubscribeFromChannel(activeChannel);
                                 }}
                                 className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
                               >
                                 <X className="w-5 h-5" />
                                 <span>Unsubscribe from Community</span>
                               </button>
                             </>
                           ) : (
                             <button 
                               type="button"
                               onClick={() => {
                                 handleSubscribeToChannel(activeChannel);
                               }}
                               className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-md"
                             >
                               <Plus className="w-5 h-5" />
                               <span>Join Community</span>
                             </button>
                           )}
                         </div>
                     </div>`;

const replace = `                     {/* Telegram-style Channel Profile */}
                     <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                         <button 
                             onClick={() => setShowChannelDetailsModal(false)}
                             className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition"
                         >
                             <ArrowLeft className="w-6 h-6" />
                         </button>
                         <button className="p-2 -mr-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition">
                             <MoreVertical className="w-6 h-6" />
                         </button>
                     </div>
                     <div className="flex flex-col items-center pt-4 pb-6 px-4">
                         <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-4 border border-zinc-200 dark:border-zinc-700">
                             <img src={activeChannel.imageUrl} alt="Channel" className="w-full h-full object-cover" />
                         </div>
                         <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                             {activeChannel.name}
                             <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                         </h2>
                         <p className="text-sm text-zinc-500 mt-1">{activeChannel.subscriberCount || 1} subscribers</p>
                         
                         <div className="flex items-center justify-center gap-3 w-full mt-6 px-2">
                             {activeChannel.creatorId === user?.uid ? (
                               <>
                                <button className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                                    <Phone className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Live Stream</span>
                                </button>
                                <button className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                                    <VolumeX className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Mute</span>
                                </button>
                                <button className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                                    <Plus className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Add Story</span>
                                </button>
                               </>
                             ) : (
                               <>
                                {!userSubscription ? (
                                    <button onClick={() => handleSubscribeToChannel(activeChannel)} className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                                        <Plus className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                                        <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Join</span>
                                    </button>
                                ) : (
                                    <button onClick={() => handleUnsubscribeFromChannel(activeChannel)} className="flex-1 flex flex-col items-center justify-center py-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition">
                                        <X className="w-5 h-5 text-rose-600 dark:text-rose-400 mb-1.5" />
                                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Leave</span>
                                    </button>
                                )}
                                <button onClick={() => userSubscription && handleToggleMuteChannel(activeChannel, userSubscription.muted)} className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                                    {userSubscription?.muted ? <VolumeX className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" /> : <Volume2 className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />}
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">{userSubscription?.muted ? "Unmute" : "Mute"}</span>
                                </button>
                                <button className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                                    <Forward className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Share</span>
                                </button>
                                <button className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                                    <AlertCircle className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Report</span>
                                </button>
                               </>
                             )}
                         </div>
                     </div>
                     <div className="px-4">
                        <div className="bg-zinc-50 dark:bg-[#1C1C1D] rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-[15px] font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                    <span>👑</span> <span>{activeChannel.name}</span> <span>👑</span>
                                </h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                    {activeChannel.description || "Welcome to our exclusive product broadcast channel."}
                                </p>
                                <p className="text-xs text-zinc-400 mt-3 font-medium">Description</p>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-zinc-900 dark:text-zinc-100">t.me/{activeChannel.customLink}</p>
                                <p className="text-xs text-zinc-400 mt-1 font-medium">Invite Link</p>
                            </div>
                        </div>
                     </div>
                     
                     {activeChannel.creatorId === user?.uid && (
                        <div className="px-4 mt-4">
                            <div className="bg-zinc-50 dark:bg-[#1C1C1D] rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                                <div className="p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-zinc-500" />
                                        <span className="text-sm font-medium">Subscribers</span>
                                    </div>
                                    <span className="text-sm text-emerald-500">{activeChannel.subscriberCount || 1}</span>
                                </div>
                                <div className="p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <Star className="w-5 h-5 text-zinc-500" />
                                        <span className="text-sm font-medium">Administrators</span>
                                    </div>
                                    <span className="text-sm text-emerald-500">1</span>
                                </div>
                                <div className="p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <X className="w-5 h-5 text-zinc-500" />
                                        <span className="text-sm font-medium">Removed Users</span>
                                    </div>
                                    <span className="text-sm text-emerald-500">0</span>
                                </div>
                            </div>
                        </div>
                     )}

                     <div className="mt-6 flex justify-center border-b border-zinc-200 dark:border-zinc-800">
                         <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-full p-1 w-64 mb-4">
                             <button className="flex-1 py-1.5 bg-white dark:bg-zinc-700 text-sm font-bold rounded-full shadow-sm">Media</button>
                             <button className="flex-1 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">Links</button>
                         </div>
                     </div>`;

code = code.replace(target, replace);
fs.writeFileSync('pages/Messages.tsx', code);
