const fs = require('fs');
let code = fs.readFileSync('pages/Messages.tsx', 'utf8');

const target = `            {/* Background elements */}`;
const replace = `            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
            <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />
            <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
            {/* Background elements */}`;

code = code.replace(target, replace);
fs.writeFileSync('pages/Messages.tsx', code);
