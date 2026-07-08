const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

const target = `      <AnimatePresence>
        {showForwardModal`;

const replace = `      {/* User Info Modal */}
      <AnimatePresence>
        {showUserInfoModal && activeChat && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl font-inter flex flex-col relative"
            >
              <div className="p-4 flex items-center justify-between">
                <button onClick={() => setShowUserInfoModal(false)} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <ArrowLeft className="w-6 h-6 text-zinc-900 dark:text-white" />
                </button>
                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)} className="p-2 -mr-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                    <MoreVertical className="w-6 h-6 text-zinc-900 dark:text-white" />
                  </button>
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-50"
                      >
                        <button className="w-full text-left px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between">
                          <span>Auto-Delete</span>
                          <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Block user
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2">
                          <PinOff className="w-4 h-4" />
                          Disable Sharing
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex flex-col items-center pt-2 pb-6 px-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-4 border border-zinc-200 dark:border-zinc-700">
                  {activeChat.otherUser?.photoURL ? (
                    <img src={activeChat.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30">
                      {(activeChat.otherUser?.displayName || activeChat.otherUser?.shopName || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {activeChat.otherUser?.shopName || activeChat.otherUser?.displayName || 'Unknown User'}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">last seen recently</p>
                
                <div className="flex items-center gap-3 mt-6 w-full px-4">
                  <button onClick={() => setShowUserInfoModal(false)} className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                    <MessageSquareShare className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Message</span>
                  </button>
                  <button className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                    <VolumeX className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Mute</span>
                  </button>
                  <button onClick={() => { setShowUserInfoModal(false); startCall('audio'); }} className="flex-1 flex flex-col items-center justify-center py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                    <Phone className="w-5 h-5 text-zinc-900 dark:text-white mb-1.5" />
                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white">Call</span>
                  </button>
                </div>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-[#1C1C1D]">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                  <p className="text-base text-zinc-900 dark:text-zinc-100">{activeChat.otherUser?.email || "Unknown"}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{activeChat.otherUser?.email ? "Email" : "Mobile"}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForwardModal`;

code = code.replace(target, replace);
fs.writeFileSync('pages/Messages.tsx', code);
