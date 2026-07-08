const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

code = code.replace(
  `  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);`,
  `  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);`
);

code = code.replace(
  `                             <h3 className="font-bold text-[16px] text-zinc-900 dark:text-zinc-100 truncate">`,
  `                             <h3 className="font-bold text-[16px] text-zinc-900 dark:text-zinc-100 truncate cursor-pointer hover:underline" onClick={() => setShowUserInfoModal(true)}>`
);

fs.writeFileSync('pages/Messages.tsx', code);
