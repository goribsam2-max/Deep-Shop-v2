const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

const target = `                                     {msg.text && (
                                         <div 
                                             onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(isMenuOpen ? null : msg.id); }}
                                             className={\`px-4 py-2.5 rounded-2xl shadow-sm cursor-pointer select-none relative \${isMe ? 'bg-[#e6c1e3] text-zinc-900 rounded-br-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'}\`}
                                         >
                                             <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                                 {renderTextWithLinks(msg.text, isMe)}
                                             </p>
                                             <LinkPreviewCard text={msg.text} isMe={isMe} />
                                         </div>
                                     )}
                                     {/* Reactions Badge / Add Reaction */}
                                     <div 
                                         className={\`absolute -bottom-2 \${isMe ? 'right-2' : 'right-2'} flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-full px-2 py-0.5 z-10 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer \${reactionEntries.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}\`} 
                                         onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(msg.id); }}
                                     >
                                         {reactionEntries.length > 0 ? (
                                             <>
                                                 {Array.from(new Set(reactionEntries.map(([uid, emoji]) => emoji))).map((emoji: any) => (
                                                     <span key={emoji} className="text-[12px]">{emoji}</span>
                                                 ))}
                                                 {reactionEntries.length > 1 && (
                                                     <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 self-center ml-0.5">{reactionEntries.length}</span>
                                                 )}
                                             </>
                                         ) : (
                                             <div className="flex items-center text-zinc-400 py-[2px]">
                                                <Plus className="w-3 h-3" />
                                             </div>
                                         )}
                                     </div>
                                     <span className="text-[9px] font-semibold text-zinc-400 mt-1 mx-1">
                                         {formatTime12h(msg.timestamp)}</span>{isMe && idx === messages.length - 1 && <div className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase tracking-wide select-none">{activeChat.seenBy && activeChat.seenBy.includes(activeChat.otherUser.id) ? "Seen" : (otherUserPresence?.isOnline ? "Delivered" : "Sent")}</div>}<span className="hidden">
                                     </span>
                                 </div>
                             </div>`;

const replace = `                                     {msg.text && (
                                         <div 
                                             onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(isMenuOpen ? null : msg.id); }}
                                             className={\`px-3 py-1.5 rounded-[18px] shadow-sm cursor-pointer select-none relative flex flex-col \${isMe ? 'bg-[#E1FFC7] dark:bg-[#2B5278] text-black dark:text-white rounded-br-none' : 'bg-white dark:bg-[#181818] text-black dark:text-white rounded-bl-none border border-zinc-100 dark:border-zinc-800/50'}\`}
                                         >
                                             <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words pr-12">
                                                 {renderTextWithLinks(msg.text, isMe)}
                                             </p>
                                             <LinkPreviewCard text={msg.text} isMe={isMe} />
                                             <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                                 <span className={\`text-[10px] font-medium \${isMe ? 'text-emerald-700/60 dark:text-blue-200/60' : 'text-zinc-400'}\`}>
                                                     {formatTime12h(msg.timestamp)}
                                                 </span>
                                                 {isMe && (
                                                    <span className={\`\${activeChat.seenBy && activeChat.seenBy.includes(activeChat.otherUser?.id) ? 'text-blue-500' : 'text-emerald-700/60 dark:text-blue-200/60'}\`}>
                                                        <CheckCheck className="w-3.5 h-3.5" />
                                                    </span>
                                                 )}
                                             </div>
                                         </div>
                                     )}
                                     {/* Reactions Badge / Add Reaction */}
                                     {reactionEntries.length > 0 && (
                                         <div 
                                             className={\`absolute -bottom-3 \${isMe ? 'right-2' : 'right-2'} flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-full px-2 py-0.5 z-10 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer scale-100\`} 
                                             onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(msg.id); }}
                                         >
                                             {Array.from(new Set(reactionEntries.map(([uid, emoji]) => emoji))).map((emoji: any) => (
                                                 <span key={emoji} className="text-[13px]">{emoji}</span>
                                             ))}
                                             {reactionEntries.length > 1 && (
                                                 <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 self-center ml-0.5">{reactionEntries.length}</span>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             </div>`;

code = code.replace(target, replace);
fs.writeFileSync('pages/Messages.tsx', code);
