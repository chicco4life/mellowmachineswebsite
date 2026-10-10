import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const profile=await mkdtemp(join(tmpdir(),'mml-headless-'));
const browser=spawn('/usr/bin/arch',['-arm64','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let startupErrors='';browser.stderr.on('data',data=>{startupErrors=(startupErrors+data.toString()).slice(-3000);});
let socket;
try{
 let portFile;
 for(let n=0;n<200;n++){try{portFile=await readFile(join(profile,'DevToolsActivePort'),'utf8');break;}catch{if(browser.exitCode!==null)break;await new Promise(r=>setTimeout(r,100));}}
 assert(portFile,'Headless browser did not start: '+startupErrors);
 const [port,path]=portFile.trim().split('\n');
 socket=new WebSocket('ws://127.0.0.1:'+port+path);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let nextId=0;const pending=new Map();
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result);}});
 function call(method,params={},sessionId){const id=++nextId;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params,...sessionId?{sessionId}:{}}));});}
 const {targetId}=await call('Target.createTarget',{url:'about:blank'}),{sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
 const command=(method,params)=>call(method,params,sessionId);
 await command('Page.enable');await mkdir('outputs',{recursive:true});const results=[];
 for(const [route,width,height,name] of [['/',1440,1000,'desktop'],['/',390,900,'mobile'],['/learn/',1440,1000,'library-desktop'],['/learn/',390,900,'library-mobile'],['/learn/buddygotchi-build/',390,900,'build-mobile'],['/learn/esp32-parts-list/',390,900,'parts-mobile'],['/learn/esp32-ai-agent/',390,900,'guide-mobile'],['/learn/mellowharness-quickstart/',1440,1000,'quickstart-desktop'],...['agent-harness-design','system-one-models','coding-agent-companion','jev-decision-latency'].flatMap(slug=>[[`/learn/${slug}/`,1440,1000,slug+'-desktop'],[`/learn/${slug}/`,390,900,slug+'-mobile']])]){
  await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
  await command('Page.navigate',{url:'http://127.0.0.1:5176'+route});
  await new Promise(r=>setTimeout(r,350));
  const readiness=await command('Runtime.evaluate',{expression:'document.fonts.ready.then(()=>true)',awaitPromise:true,returnByValue:true});assert.equal(readiness.result.value,true);
  const {result}=await command('Runtime.evaluate',{expression:`JSON.stringify({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,headings:document.querySelectorAll('h1').length,brokenImages:[...document.images].filter(i=>i.loading!=='lazy'&&(!i.complete||!i.naturalWidth)).map(i=>i.src),minimumTextSize:Math.min(...[...document.querySelectorAll('p,a,summary,figcaption')].filter(e=>!e.closest('.buddy-demo')).map(e=>parseFloat(getComputedStyle(e).fontSize))),minimumDemoTextSize:Math.min(...[...document.querySelectorAll('.buddy-demo p,.buddy-demo button,.buddy-demo label')].map(e=>parseFloat(getComputedStyle(e).fontSize))),overflowElements:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&!e.closest('pre,.table-scroll')).slice(0,5).map(e=>e.tagName+'.'+e.className)})`,returnByValue:true});
  const metrics=JSON.parse(result.value);results.push({route,...metrics});
  const screenshot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('outputs/'+name+'-2026-10-10.png',Buffer.from(screenshot.data,'base64'));
  assert.equal(metrics.width,width,JSON.stringify(metrics));assert(metrics.scrollWidth<=width+1,JSON.stringify(metrics));assert.equal(metrics.headings,1);assert.deepEqual(metrics.brokenImages,[]);assert(metrics.minimumTextSize>=14,JSON.stringify(metrics));if(route==='/')assert(metrics.minimumDemoTextSize>=12,JSON.stringify(metrics));
  if(route==='/learn/'){const r=await command('Runtime.evaluate',{expression:`(()=>{const summary=document.querySelector('.library-questions summary');summary.click();return summary.parentElement.open;})()`,returnByValue:true});assert.equal(r.result.value,true);}
 }
 await command('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1,mobile:false});
 await command('Page.navigate',{url:'http://127.0.0.1:5176/assets/jev-latency-distribution.svg'});
 await new Promise(r=>setTimeout(r,350));
 await command('Runtime.evaluate',{expression:'document.fonts.ready.then(()=>true)',awaitPromise:true,returnByValue:true});
 const plot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 await writeFile('dist/assets/jev-latency-distribution.png',Buffer.from(plot.data,'base64'));
 await writeFile('outputs/layout-verification.json',JSON.stringify({passed:true,scope:'Isolated headless Chrome; local pages only.',results},null,2));
 console.log(JSON.stringify({passed:true,results}));
}finally{socket?.close();browser.kill('SIGTERM');await new Promise(resolve=>{if(browser.exitCode!==null)resolve();else browser.once('exit',resolve);});await rm(profile,{recursive:true,force:true});}
