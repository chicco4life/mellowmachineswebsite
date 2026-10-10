// Visuals and cue scores come from the existing Boop bank. Playback is browser-local.
import {makeScene,chooseVariation,sceneEvents,synthesizeCue} from './source/bank.mjs';
import {catalog} from './source/catalog.mjs';
import {voiceStart} from './source/mood-art.mjs';
const mount=document.querySelector('#pixel-mount');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let pair={mood:'calm',state:'idle'}, scene=null, paused=true, elapsed=0, frames=0, lastStamp=0;
let previousId=null, transient=false, transientUntil=0, variation=0, context=null;
const sounds=new Set();
let mouthOpen=false,speechActive=false,mouthUpdates=0,mouths=[];
const ns='http://www.w3.org/2000/svg';
function updateMouths(){
  for(const {original,talking} of mouths){
    original.style.visibility=mouthOpen?'hidden':'';talking.style.display=mouthOpen?'':'none';
    if(!mouthOpen)continue;
    const box=original.getBBox();
    talking.setAttribute('transform','translate('+Math.floor(box.x+box.width/2-7)+' '+Math.floor(box.y+box.height/2-5)+')');
    talking.setAttribute('fill',original.querySelector('path[fill],rect[fill]')?.getAttribute('fill')||'#F8F7EF');
  }
}
function installMouths(){
  mouths=[...mount.querySelectorAll('[data-part="mouth"]')].map(original=>{
    const talking=document.createElementNS(ns,'g');talking.dataset.previewTalkingMouth='';talking.setAttribute('aria-hidden','true');
    for(const [x,y,width,height] of [[0,0,14,4],[0,4,4,4],[10,4,4,4],[0,8,14,4]]){
      const rect=document.createElementNS(ns,'rect');
      for(const [key,value] of Object.entries({x,y,width,height}))rect.setAttribute(key,String(value));
      talking.append(rect);
    }
    original.after(talking);return {original,talking};
  });updateMouths();
}
function setMouth(value){mouthOpen=Boolean(value);mouthUpdates++;updateMouths();}
function setSpeechActive(value){speechActive=Boolean(value);if(value)stopSound();else setMouth(false);}
function install(next) {
  scene=next; mount.innerHTML=scene.svg;
  const svg=mount.querySelector('svg'); svg.pauseAnimations(); svg.setCurrentTime(0);
  elapsed=0; previousId=scene.asset.id;
  installMouths();
}
function choose(next) {
  const hostContext=next.state==='task_complete'?{completionOutcome:'success'}:{};
  return makeScene(chooseVariation(next,{previousId,random:()=>((variation++*7+3)%19)/19,hostContext}));
}
function setState(next) {
  const state=next.state || 'idle', mood=next.mood || 'calm';
  if (!catalog.some(a=>a.state===state&&a.mood===mood)) throw new Error('Unknown pixel mood/state pair: '+mood+'/'+state);
  pair={mood,state};transient=false;install(choose(pair));
}
function setPaused(value) { paused=Boolean(value);lastStamp=0; }
function poke() {
  transient=true;install(choose({mood:pair.mood,state:'poked'}));
  transientUntil=scene.asset.seconds;setPaused(false);
}
function stopSound() { for(const source of sounds){try{source.stop();}catch{}}sounds.clear(); }
async function playSound() {
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Audio)throw new Error('Web Audio is unavailable.');
  context ||= new Audio(); await context.resume();stopSound();
  const plan=sceneEvents(scene,{cycle:0,seed:53});
  for(const event of plan.slice(0,12)){
    const pcm=synthesizeCue(event,53,context.sampleRate);
    const buffer=context.createBuffer(1,pcm.length,context.sampleRate);buffer.copyToChannel(pcm,0);
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=buffer;gain.gain.value=Math.min(.25,Math.max(0,event.gain*.22));
    source.connect(gain);gain.connect(context.destination);sounds.add(source);
    source.onended=()=>{sounds.delete(source);source.disconnect();gain.disconnect();};
    source.start(context.currentTime+Math.max(0,event.at));
  }
}
document.querySelector('#pixel-tap').addEventListener('click',()=>{
  poke();
  try{parent.document.dispatchEvent(new CustomEvent('buddy-interaction',{detail:{kind:'tap'}}));}catch{}
});
document.addEventListener('visibilitychange',()=>{lastStamp=0;if(document.hidden)stopSound();});
function tick(stamp) {
  if(!paused&&!document.hidden&&scene){
    if(lastStamp)elapsed+=Math.min(.1,(stamp-lastStamp)/1000);
    lastStamp=stamp;frames++;
    if(transient&&elapsed>=transientUntil){transient=false;install(choose(pair));}
    else if(!transient&&elapsed>=scene.asset.seconds){install(choose(pair));}
    const svg=mount.querySelector('svg');svg?.setCurrentTime(reduced.matches?0:elapsed);
    updateMouths();
  }else lastStamp=0;
  requestAnimationFrame(tick);
}
setState(pair);requestAnimationFrame(tick);
window.pixelPreview={
  setState,setPaused,poke,playSound,stopSound,setMouth,setSpeechActive,
  voiceWindowMs:()=>Math.round(voiceStart(scene.asset.state,scene.score)*1000),
  getState:()=>({character:'pixel',rendering:'original-pixel-svg',mood:pair.mood,state:pair.state,paused,frames,elapsed,transient,id:scene?.asset.id,variation:scene?.asset.variation,catalogueSize:catalog.length,audioState:context?.state||'not-started',activeSources:sounds.size,mouthOpen,speechActive,mouthUpdates,mouthTargets:mouths.length})
};
