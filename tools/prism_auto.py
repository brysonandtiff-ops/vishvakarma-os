#!/usr/bin/env python3
"""PRISM Auto v2 — universal proof runner. --skip-heavy is lightweight only."""
from __future__ import annotations
import argparse, json, os, platform, shutil, subprocess, sys, time, zipfile, hashlib
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Sequence
ROOT=Path(__file__).resolve().parents[1]
EVIDENCE_ROOT=ROOT/'evidence'/'prism_auto'
@dataclass
class Step:
    name:str; command:list[str]; returncode:int; seconds:float; log:str; required:bool=True; skipped:bool=False; note:str=''
def rel(p:Path)->str:
    try: return str(p.relative_to(ROOT)).replace('\\','/')
    except ValueError: return str(p)
def read_json(p:Path)->dict[str,Any]:
    try: return json.loads(p.read_text(encoding='utf-8'))
    except Exception: return {}
def which(n:str)->str|None: return shutil.which(n)
def npm_cmd()->list[str]|None:
    npm=which('npm.cmd') or which('npm')
    if not npm: return None
    if platform.system().lower()=='windows' and npm.lower().endswith(('.cmd','.bat')):
        return [os.environ.get('COMSPEC') or which('cmd.exe') or 'cmd.exe','/d','/c',npm]
    return [npm]
def run_step(name:str, cmd:Sequence[str], out:Path, required:bool=True, timeout:int=180)->Step:
    start=time.time(); logp=out/f'{name}.log'; env=os.environ.copy(); env['PRISM_AUTO_RUNNING']='1'
    with logp.open('w',encoding='utf-8',errors='replace') as log:
        log.write('$ '+' '.join(cmd)+'\n\n'); log.flush()
        try: rc=subprocess.run(list(cmd),cwd=str(ROOT),env=env,stdout=log,stderr=subprocess.STDOUT,text=True,timeout=timeout,shell=False).returncode
        except subprocess.TimeoutExpired: log.write(f'\nTIMEOUT after {timeout}s\n'); rc=124
        except FileNotFoundError as exc: log.write(f'\nMISSING COMMAND: {exc}\n'); rc=127
    return Step(name,list(cmd),rc,round(time.time()-start,2),rel(logp),required)
def skip(name:str,out:Path,note:str,required:bool=False)->Step:
    logp=out/f'{name}.log'; logp.write_text('SKIP: '+note+'\n',encoding='utf-8')
    return Step(name,[],0,0.0,rel(logp),required,True,note)
def detect()->dict[str,Any]:
    pkg=read_json(ROOT/'package.json'); web=read_json(ROOT/'web'/'package.json')
    txt=json.dumps(pkg).lower(); wtxt=json.dumps(web).lower()
    return {'godot':(ROOT/'godot'/'project.godot').exists() or (ROOT/'project.godot').exists(),'unity':(ROOT/'ProjectSettings'/'ProjectVersion.txt').exists(),'node':(ROOT/'package.json').exists(),'web_node':(ROOT/'web'/'package.json').exists(),'vite':'vite' in txt or 'vite' in wtxt,'next':'next' in txt or (ROOT/'next.config.js').exists() or (ROOT/'next.config.mjs').exists(),'pwa':(ROOT/'manifest.webmanifest').exists() or (ROOT/'public'/'manifest.json').exists() or 'vite-plugin-pwa' in txt,'expo':'expo' in txt or (ROOT/'app.json').exists(),'react_native':'react-native' in txt,'capacitor':(ROOT/'capacitor.config.ts').exists() or (ROOT/'capacitor.config.json').exists(),'android':(ROOT/'gradlew').exists() or (ROOT/'android'/'gradlew').exists() or (ROOT/'android'/'gradlew.bat').exists(),'ios':any(ROOT.glob('*.xcodeproj')) or (ROOT/'ios').exists(),'flutter':(ROOT/'pubspec.yaml').exists(),'python':(ROOT/'pyproject.toml').exists() or (ROOT/'requirements.txt').exists() or (ROOT/'setup.py').exists(),'tauri':(ROOT/'src-tauri'/'tauri.conf.json').exists(),'electron':'electron' in txt}
def types(m:dict[str,Any])->list[str]: return [k for k,v in m.items() if v] or ['unknown']
def scripts(d:Path)->dict[str,str]:
    s=read_json(d/'package.json').get('scripts',{})
    return s if isinstance(s,dict) else {}
def node_cmd(d:Path,script:str)->list[str]|None:
    npm=npm_cmd()
    if not npm: return None
    return [*npm,'run',script,'--silent'] if d==ROOT else [*npm,'--prefix',str(d),'run',script,'--silent']
def add_node(steps:list[Step],out:Path,d:Path,prefix:str,heavy:bool,timeout:int):
    s=scripts(d)
    if not s: steps.append(skip(prefix+'_scripts',out,'No package scripts found')); return
    if not heavy: steps.append(skip(prefix+'_heavy_scripts',out,'--skip-heavy: build/test/lint/typecheck skipped')); return
    for name in ['lint','typecheck','test','build']:
        if name in s:
            cmd=node_cmd(d,name)
            if cmd: steps.append(run_step(prefix+'_'+name,cmd,out,required=(name=='build'),timeout=timeout))
def sha(p:Path)->str:
    h=hashlib.sha256()
    with p.open('rb') as f:
        for c in iter(lambda:f.read(1048576),b''): h.update(c)
    return h.hexdigest()
def iter_files(out:Path):
    for p in sorted(out.rglob('*')):
        if p.is_file() and p.name!='prism_auto_evidence.zip': yield p
def report(out:Path,m:dict[str,Any],steps:list[Step])->int:
    failures=[s for s in steps if s.required and not s.skipped and s.returncode!=0]; warnings=[s for s in steps if not s.required and not s.skipped and s.returncode!=0]
    manifest={'schema':'prism_auto.v2','repo':ROOT.name,'path':str(ROOT),'created_at':datetime.now().isoformat(timespec='seconds'),'detected_types':types(m),'steps':[asdict(s) for s in steps],'required_failures':[s.name for s in failures],'warnings':[s.name for s in warnings],'status':'PASS' if not failures else 'FAIL'}
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    lines=['# PRISM Auto Evidence','',f'- Repo: `{ROOT.name}`',f'- Status: `{manifest["status"]}`',f'- Detected: `{", ".join(types(m))}`',f'- Created: `{manifest["created_at"]}`','','## Steps','']
    for s in steps:
        state='SKIP' if s.skipped else ('PASS' if s.returncode==0 else ('FAIL' if s.required else 'WARN'))
        lines.append(f'- **{state}** `{s.name}` rc=`{s.returncode}` time=`{s.seconds}s` log=`{s.log}`')
        if s.note: lines.append(f'  - {s.note}')
    (out/'SUMMARY.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    (out/'SHA256SUMS.txt').write_text('\n'.join(f'{sha(p)}  {rel(p)}' for p in iter_files(out))+'\n',encoding='utf-8')
    with zipfile.ZipFile(out/'prism_auto_evidence.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
        for p in iter_files(out): z.write(p,arcname=rel(p.relative_to(out)))
    print(f'PRISM_AUTO_SUMMARY: {rel(out/"SUMMARY.md")}')
    return 0 if not failures else 1
def main(argv:Sequence[str])->int:
    ap=argparse.ArgumentParser(); ap.add_argument('--reason',default='manual'); ap.add_argument('--ci',action='store_true'); ap.add_argument('--skip-heavy',action='store_true'); ap.add_argument('--timeout',type=int,default=180); args=ap.parse_args(argv)
    out=EVIDENCE_ROOT/(datetime.now().strftime('%Y%m%d-%H%M%S')+'-'+args.reason[:48].replace('/','-')); out.mkdir(parents=True,exist_ok=True)
    m=detect(); steps=[]; steps.append(run_step('repo_status',['git','status','--short'],out,required=False,timeout=60)); (out/'repo_profile.json').write_text(json.dumps({'repo':ROOT.name,'detected_types':types(m)},indent=2)+'\n',encoding='utf-8')
    heavy=not args.skip_heavy
    if m['godot']:
        godot=which('godot') or which('godot4') or os.environ.get('GODOT_BIN'); proj=ROOT/'godot' if (ROOT/'godot'/'project.godot').exists() else ROOT
        steps.append(run_step('godot_headless_smoke',[godot,'--path',str(proj),'--headless','--quit-after','8'],out,required=False,timeout=args.timeout) if (godot and heavy) else skip('godot_headless_smoke',out,'Godot smoke skipped in --skip-heavy or Godot not found'))
    if m['node']: add_node(steps,out,ROOT,'node',heavy,args.timeout)
    if m['web_node']: add_node(steps,out,ROOT/'web','web',heavy,args.timeout)
    if m['python']: steps.append(run_step('python_tests',[sys.executable,'-m','pytest','-q'],out,required=False,timeout=args.timeout) if (heavy and (ROOT/'tests').exists()) else skip('python_tests',out,'Python tests skipped or no tests folder'))
    if m['flutter']:
        flutter=which('flutter'); steps.append(run_step('flutter_analyze',[flutter,'analyze'],out,required=False,timeout=args.timeout) if (flutter and heavy) else skip('flutter_analyze',out,'Flutter analyze skipped in --skip-heavy or Flutter not found'))
    return report(out,m,steps)
if __name__=='__main__': raise SystemExit(main(sys.argv[1:]))
