// Development-only source for Sample Cafe's original placeholder PNG artwork.
// Run `node clients/sample-cafe/assets/create-placeholders.js` to regenerate it.
const path = require('path');
const {Buffer} = require('buffer');
const sharp = require('sharp');

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
<rect width="1024" height="1024" fill="#352419"/><circle cx="512" cy="512" r="393" fill="#D69E5D"/>
<path d="M278 420h360v175c0 102-81 181-180 181S278 697 278 595V420Z" fill="#FFF7EA"/>
<path d="M638 461h49c64 0 92 50 74 102-14 40-58 60-123 55" fill="none" stroke="#FFF7EA" stroke-width="52" stroke-linecap="round"/>
<path d="M360 347c-45-55 28-83 0-136M485 347c-45-55 28-83 0-136M610 347c-45-55 28-83 0-136" fill="none" stroke="#FFF7EA" stroke-width="29" stroke-linecap="round"/>
<path d="M326 789h293" stroke="#FFF7EA" stroke-width="32" stroke-linecap="round"/></svg>`;

const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
<circle cx="600" cy="600" r="447" fill="#D69E5D"/><circle cx="600" cy="600" r="418" fill="#7B3F27"/>
<path d="M326 520h440v198c0 125-97 217-220 217s-220-92-220-217V520Z" fill="#FFF7EA"/>
<path d="M766 574h65c81 0 108 63 87 122-20 56-72 74-152 69" fill="none" stroke="#FFF7EA" stroke-width="57" stroke-linecap="round"/>
<path d="M433 421c-51-64 32-103 0-168M573 421c-51-64 32-103 0-168M713 421c-51-64 32-103 0-168" fill="none" stroke="#FFF7EA" stroke-width="33" stroke-linecap="round"/></svg>`;

const brand = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
<circle cx="205" cy="210" r="170" fill="#7B3F27"/>
<path d="M98 190h190v79c0 57-42 102-95 102s-95-45-95-102v-79Z" fill="#FFF7EA"/>
<path d="M288 210h28c40 0 55 31 44 59-9 25-35 35-72 33" fill="none" stroke="#FFF7EA" stroke-width="28" stroke-linecap="round"/>
<path d="M135 158c-21-27 15-44 0-73M198 158c-21-27 15-44 0-73M261 158c-21-27 15-44 0-73" fill="none" stroke="#D69E5D" stroke-width="16" stroke-linecap="round"/>
<text x="430" y="198" fill="#352419" font-family="sans-serif" font-weight="700" font-size="95" letter-spacing="7">SAMPLE</text>
<text x="430" y="304" fill="#7B3F27" font-family="sans-serif" font-weight="700" font-size="104" letter-spacing="13">CAFE</text></svg>`;

async function main() {
  for (const [name, svg] of [['app-icon.png', icon], ['splash-logo.png', splash], ['brand-logo.png', brand]]) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, name));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
