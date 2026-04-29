const colors = require('tailwindcss/colors');

function printTheme(name, blueMap, indigoMap, orangeMap) {
  let out = `/* Theme - ${name} */\n.theme-${name} {\n`;
  const stops = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  
  stops.forEach(s => { out += `  --blue-${s}: ${colors[blueMap][s]};\n`; });
  out += '\n';
  stops.forEach(s => { out += `  --indigo-${s}: ${colors[indigoMap][s]};\n`; });
  out += '\n';
  stops.forEach(s => { out += `  --orange-${s}: ${colors[orangeMap][s]};\n`; });
  
  out += '}\n';
  return out;
}

const fs = require('fs');
let css = '';
css += printTheme('ocean', 'sky', 'cyan', 'teal');
css += printTheme('sunset', 'red', 'rose', 'amber');
css += printTheme('lavender', 'purple', 'fuchsia', 'pink');
css += printTheme('monochrome', 'slate', 'gray', 'zinc');

console.log(css);
