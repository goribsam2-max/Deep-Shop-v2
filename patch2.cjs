const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

const target1 = `                                    className="flex gap-2 justify-start relative pb-3"`;
const replace1 = `                                    className="flex gap-2 justify-start relative pb-3 group"`;
code = code.replace(target1, replace1);

const target2 = `                                      <div className="max-w-[75%] items-start flex flex-col relative">`;
const replace2 = `                                      <div className="max-w-[75%] items-start flex flex-col relative group/bubble">`;
code = code.replace(target2, replace2);

const target3 = `                                      <div 
                                          className={\`absolute -bottom-2 right-2 flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-full px-1.5 py-0.5 z-10 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer \${reactionEntries.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}\`} 
                                          onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(msg.id); }}
                                      >`;
const replace3 = `                                      <div 
                                          className={\`absolute -bottom-2 right-2 flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-full px-2 py-0.5 z-10 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer \${reactionEntries.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}\`} 
                                          onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(msg.id); }}
                                      >`;
code = code.replace(target3, replace3);

fs.writeFileSync('pages/Messages.tsx', code);
