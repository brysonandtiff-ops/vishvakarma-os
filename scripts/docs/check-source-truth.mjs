#!/usr/bin/env node
// Read-only repository-wide Markdown drift scan + strict current-source contract.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const text=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const pkg=JSON.parse(text('package.json'));
const critical=['README.md','docs/README.md','docs/user/GETTING_STARTED.md',
 'docs/release/CURRENT_RELEASE_STATUS.md','docs/repository/SOURCE_OF_TRUTH_20261119.md',
 'docs/CURRENT_PRODUCTION_ARCHITECTURE.md','docs/DOCUMENTATION_STANDARDS.md'];
const required=[...critical,'docs/repository/DOCUMENTATION_DEBT_20261119.md',
 'docs/release/evidence/REVIEW_VERIFICATION_LEDGER_20261119.md'];
const failures=[];
for(const p of required)if(!fs.existsSync(path.join(root,p)))failures.push('Missing '+p);
for(const p of critical){if(!fs.existsSync(path.join(root,p)))continue;
  const src=text(p);
  if(!src.includes('vishvakarmaos.app'))failures.push('No current domain: '+p);
}
for(const p of ['README.md','docs/README.md','docs/user/GETTING_STARTED.md']){
  if(text(p).includes('https://vishvakarma-os.app'))failures.push('Retired onboarding URL: '+p);
}
if(!text('docs/release/CURRENT_RELEASE_STATUS.md').includes('BLOCKED'))failures.push('Release HOLD missing');
if(!text('docs/release/CURRENT_RELEASE_STATUS.md').includes('#153')||
   !text('docs/release/CURRENT_RELEASE_STATUS.md').includes('#188'))failures.push('Security/backup HOLD missing');
if(!text('docs/repository/SOURCE_OF_TRUTH_20261119.md').includes(pkg.version))
  failures.push('Source matrix product version differs from package.json');
const corpus=[];
function walk(rel){const d=path.join(root,rel);if(!fs.existsSync(d))return;
 for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.posix.join(rel,e.name);
  if(e.isDirectory())walk(p);else if(e.isFile()&&p.endsWith('.md'))corpus.push(p);
 }}
walk('docs');corpus.push('README.md','AGENTS.md');
const patterns=[
 /https:\/\/vishvakarma-os\.app/gi,
 new RegExp('\\b'+['ver','cel'].join('')+'\\b','gi'),
 /Google[\s-]+(?:SSO[\s-]+)?only/gi,
 /\bPRODUCTION READY\b/gi,
 /vishvakarma-os-live\//gi,
];
const warnings=[];
for(const p of corpus){const content=text(p);const count=patterns.reduce((n,re)=>n+(content.match(re)||[]).length,0);if(count)warnings.push([p,count]);}
console.log('[docs:truth] scanned '+corpus.length+' Markdown documents; potential historical drift in '+warnings.length+'.');
for(const [p,n] of warnings.slice(0,12))console.log('  review '+p+': '+n+' phrase(s)');
if(warnings.length>12)console.log('  ... plus '+(warnings.length-12)+' more files. Preserve historical context.');
if(failures.length){for(const f of failures)console.error('FAIL '+f);process.exit(1);}
console.log('PASS authoritative source-of-truth contracts. Legacy warnings remain for review.');
