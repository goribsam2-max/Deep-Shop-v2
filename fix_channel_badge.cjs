const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

const target = `                                          {/* Reactions Badge - ALWAYS positioned on bottom right */}
                                          {reactionEntries.length > 0 && (
                                              <div className="absolute -bottom-2 right-2 flex gap-1 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-md rounded-full px-1.5 py-0.5 text-[11px] select-none z-10">
                                                  {Array.from(new Set(reactionEntries.map(([uid, emoji]) => emoji))).map((emoji: any) => (
                                                      <span key={emoji}>{emoji}</span>
                                                  ))}
                                                  {reactionEntries.length > 1 && (
                                                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 self-center ml-0.5">{reactionEntries.length}</span>
                                                  )}
                                              </div>
                                          )}
                                          <span className="text-[9px] font-semibold text-zinc-400 mt-1 mx-1">
                                              {formatTime12h(msg.timestamp)}
                                          </span>`;

const replace = `                                          {/* Reactions Badge - ALWAYS positioned on bottom right */}
                                          {reactionEntries.length > 0 && (
                                              <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-full px-2 py-0.5 z-10 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer scale-100">
                                                  {Array.from(new Set(reactionEntries.map(([uid, emoji]) => emoji))).map((emoji: any) => (
                                                      <span key={emoji} className="text-[13px]">{emoji}</span>
                                                  ))}
                                                  {reactionEntries.length > 1 && (
                                                      <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 self-center ml-0.5">{reactionEntries.length}</span>
                                                  )}
                                              </div>
                                          )}`;

code = code.replace(target, replace);
fs.writeFileSync('pages/Messages.tsx', code);
