const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

const target = `                  {activeChannel.pinnedMessage && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-zinc-900/90 dark:to-zinc-950/90 border-b border-amber-100 dark:border-zinc-800 px-4 py-2 flex items-center justify-between text-xs shrink-0 z-10 shadow-sm relative">
                      <div className="flex items-center gap-2 min-w-0 cursor-pointer flex-1" onClick={() => {
                        const targetMsg = channelMessages.find(m => m.id === activeChannel.pinnedMessage.id);
                        if (targetMsg) {
                          document.getElementById(\`msg-\${targetMsg.id}\`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                          notify(\`Pinned: \${activeChannel.pinnedMessage.text}\`, "info");
                        }
                      }}>
                        <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-amber-700 dark:text-amber-500 mb-0.5">Pinned Message</p>
                          <p className="text-zinc-600 dark:text-zinc-400 truncate max-w-full">
                            {activeChannel.pinnedMessage.text || "Image"}
                          </p>
                        </div>
                      </div>
                      {activeChannel.creatorId === user?.uid && (
                        <button onClick={(e) => { e.stopPropagation(); handleUnpinMessage(); }} className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-full transition text-amber-600 dark:text-amber-500 shrink-0 ml-2">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}`;

const replace = `                  {activeChannel.pinnedMessage && (
                    <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between text-[13px] shrink-0 z-10 shadow-sm relative cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition" onClick={() => {
                        const targetMsg = channelMessages.find(m => m.id === activeChannel.pinnedMessage.id);
                        if (targetMsg) {
                          document.getElementById(\`msg-\${targetMsg.id}\`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                          notify(\`Pinned: \${activeChannel.pinnedMessage.text}\`, "info");
                        }
                      }}>
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-[3px] h-9 bg-blue-500 rounded-full mr-3 shrink-0"></div>
                        <div className="min-w-0">
                          <p className="font-bold text-blue-500 dark:text-blue-400 mb-0.5">Pinned Message</p>
                          <p className="text-zinc-600 dark:text-zinc-400 truncate max-w-full">
                            {activeChannel.pinnedMessage.text || "Image"}
                          </p>
                        </div>
                      </div>
                      {activeChannel.creatorId === user?.uid && (
                        <button onClick={(e) => { e.stopPropagation(); handleUnpinMessage(); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition text-zinc-500 shrink-0 ml-2">
                          <VolumeX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}`;

code = code.replace(target, replace);
fs.writeFileSync('pages/Messages.tsx', code);
