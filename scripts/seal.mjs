#!/usr/bin/env node
// Usage interactif : npm run seal
// Usage non interactif (dev) : node scripts/seal.mjs --code 123456 --file dev-secret.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, argv } from 'node:process';
import { seal, patchContent } from './sealLib.mjs';

const CONTENT_PATH = new URL('../src/content.js', import.meta.url);
const SECRET_PATH = new URL('../public/secret.enc', import.meta.url);

function arg(name) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function askMasked(question) {
  return new Promise((resolve) => {
    stdout.write(question);
    let buf = '';
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n') { stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); stdout.write('\n'); resolve(buf); }
      else if (ch === '') { process.exit(1); }
      else if (ch === '' || ch === '\b') { buf = buf.slice(0, -1); }
      else { buf += ch; stdout.write('•'); }
    };
    stdin.on('data', onData);
  });
}

async function askAll() {
  const rl = createInterface({ input: stdin, output: stdout });
  const content = {};
  content.destination = await rl.question('Destination (ex. LONDRES) : ');
  content.dates = await rl.question('Dates (ex. 2 – 4 OCT 2026) : ');
  content.from = await rl.question('Gare de départ (ex. PARIS GARE DU NORD) : ');
  content.to = await rl.question('Gare d arrivée (ex. LONDON ST PANCRAS) : ');
  content.passengers = await rl.question('Passagers (ex. NANO & MIMI) : ');
  stdout.write('Message (verso du billet), termine par une ligne vide :\n');
  const lines = [];
  for (;;) { const l = await rl.question(''); if (l === '') break; lines.push(l); }
  content.message = lines.join('\n');
  rl.close();
  const code = await askMasked('Code secret (chiffres, masqué) : ');
  const again = await askMasked('Confirme le code : ');
  if (code !== again) { console.error('Les deux codes diffèrent.'); process.exit(1); }
  return { code, content };
}

const { code, content } = arg('code') && arg('file')
  ? { code: arg('code'), content: JSON.parse(readFileSync(arg('file'), 'utf8')) }
  : await askAll();

if (!/^\d{4,8}$/.test(code)) { console.error('Le code doit faire 4 à 8 chiffres.'); process.exit(1); }

const { salt, hash, sealed } = await seal(code, content);
writeFileSync(SECRET_PATH, JSON.stringify(sealed));
writeFileSync(CONTENT_PATH, patchContent(readFileSync(CONTENT_PATH, 'utf8'), salt, hash));
console.log(`OK — secret.enc écrit, content.js mis à jour (codeLength attendu : ${code.length}).`);
console.log(`Destination : ${content.destination} · ${content.dates}`);
