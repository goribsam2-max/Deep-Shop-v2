const fs = require('fs');
let code = fs.readFileSync('public/custom-sw.js', 'utf8');

const target = `         data: { url: data.url || '/' }`;
const replace = `         data: { url: data.data?.url || data.url || '/' }`;

code = code.replace(target, replace);
fs.writeFileSync('public/custom-sw.js', code);
