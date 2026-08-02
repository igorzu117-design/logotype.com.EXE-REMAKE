const fs = require('fs');
const js = fs.readFileSync('script.js', 'utf8');

const startIdx = js.indexOf('const translations =');
const endIdx = js.indexOf('let currentLang =');
let code = js.substring(startIdx, endIdx);
code = code.replace('const translations =', 'var translations =');
eval(code);

console.log("Checking UA strings for untranslated Russian characters (like 'ы', 'э', 'ъ'):");
for (const [key, val] of Object.entries(translations.ua)) {
    const strVal = typeof val === 'string' ? val : JSON.stringify(val);
    if (/[ыэъЫЭЪ]/.test(strVal)) {
        console.log(`UA key "${key}" contains Russian char: ${strVal}`);
    }
}

console.log("\nChecking EN strings for Cyrillic characters:");
for (const [key, val] of Object.entries(translations.en)) {
    const strVal = typeof val === 'string' ? val : JSON.stringify(val);
    if (/[а-яА-ЯіІїЇєЄ]/.test(strVal)) {
        console.log(`EN key "${key}" contains Cyrillic: ${strVal}`);
    }
}
