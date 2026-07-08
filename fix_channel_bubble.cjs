const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

const target = `                                          {msg.text && (
                                              <div 
                                                  onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(isMenuOpen ? null : msg.id); }}
                                                  className="px-4 py-2.5 rounded-2xl shadow-sm cursor-pointer select-none relative bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-800"
                                              >
                                                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                                      {renderTextWithLinks(msg.text, false)}
                                                  </p>
                                                  
                                                  {/* URL Preview support */}
                                                  <LinkPreviewCard text={msg.text} />
                                              </div>
                                          )}`;

const replace = `                                          {msg.text && (
                                              <div 
                                                  onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(isMenuOpen ? null : msg.id); }}
                                                  className="px-3 py-1.5 rounded-[18px] shadow-sm cursor-pointer select-none relative bg-white dark:bg-[#181818] text-black dark:text-white rounded-bl-none border border-zinc-100 dark:border-zinc-800/50 flex flex-col"
                                              >
                                                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words pr-12">
                                                      {renderTextWithLinks(msg.text, false)}
                                                  </p>
                                                  
                                                  {/* URL Preview support */}
                                                  <LinkPreviewCard text={msg.text} />
                                                  
                                                  <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                                      <span className="text-[10px] font-medium text-zinc-400">
                                                          {formatTime12h(msg.timestamp)}
                                                      </span>
                                                  </div>
                                              </div>
                                          )}`;

code = code.replace(target, replace);
fs.writeFileSync('pages/Messages.tsx', code);
