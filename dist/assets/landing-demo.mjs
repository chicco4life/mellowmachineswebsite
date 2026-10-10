import {DemoClock,DURATION,STORY,stepAt} from './demo-timeline.mjs';
import {eventsAt,eventLine} from './demo-events.mjs';
import {conversationAt,speechEventsAt} from './demo-conversations.mjs';
import {createVoiceController} from './recorded-voice/controller.mjs';
const root=document.querySelector('[data-buddy-demo]');
if(root){
  const q=selector=>root.querySelector(selector),frame=q('iframe');
  const clock=new DemoClock(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let api=null,character='pixel',requestedPlay=!reduced.matches,inView=false,sound=false;
  let activeStep=-1,lastStamp=0,progressSecond=-1,eventCount=-1,touchTimer=0,temporary=false;
  const localEvents=[];
  let moment=0,voiceStatus={phase:'idle',takes:[]},mouthTransitions=0;
  const voice=createVoiceController({catalogURL:'/assets/recorded-voice/catalog.json',volume:.42,
    onMouth(open){mouthTransitions++;api?.setMouth(open);},
    onSpeechActive(active){api?.setSpeechActive(active);},
    onBubble({phase,text}){const bubble=q('[data-voice-bubble]');bubble.hidden=phase==='hidden';bubble.textContent=text;},
    onStatus(status){voiceStatus={phase:status.phase,takes:status.takes?.map(t=>t.id)||[],reason:status.reason||null};}
  });
  voice.load().catch(()=>{});
  const format=seconds=>Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');
  const title=text=>text.charAt(0).toUpperCase()+text.slice(1);
  const storyStep=()=>STORY[stepAt(clock.seconds)];
  const defaultHint=()=>storyStep().activity;
  function setPaused(value){
    if(!api)return;
    if(character==='pixel')api.setPaused(value);
    else if(api.getState().paused!==value)frame.contentDocument.querySelector('[data-pause]').click();
  }
  function stopSound(){
    moment++;voice.stop();
    if(character==='pixel')api?.stopSound();else frame.contentWindow?.SlimeSFX?.stop();
  }
  function playSound(cue='poke'){
    if(!sound||!api||document.hidden||!inView)return;
    const promise=character==='pixel'?api.playSound():frame.contentWindow.SlimeSFX.play(cue,{gain:.22});
    promise.catch(()=>{sound=false;renderSound();});
  }
  async function recordedLine(id,delayMs=450){
    if(!id||!sound||!api||document.hidden||!inView)return;
    const token=moment;
    try{
      const catalog=await voice.load();
      if(token!==moment||!sound)return;
      const take=catalog.takes.find(t=>t.id===id);
      if(!take)throw new Error('Demo recording unavailable');
      await voice.playLine([take],{delayMs});
      if(token!==moment)return;
      const upcoming=STORY.slice(activeStep+1,activeStep+6).map(s=>s.voice).filter(Boolean);
      voice.preloadTakes(upcoming).catch(()=>{});
    }catch{
      if(token===moment){stopSound();sound=false;renderSound();q('[data-interaction]').textContent='Audio unavailable. The animation keeps playing.';}
    }
  }
  function playMoment(step){
    if(step.cue||step.interaction)playSound(step.cue||'poke');
    if(!['needs_you','listening'].includes(step.pixelState)){
      recordedLine(step.voice,character==='pixel'?api?.voiceWindowMs()||450:450);
    }
  }
  function renderSound(){
    const button=q('[data-sound]');
    button.setAttribute('aria-pressed',String(sound));
    button.setAttribute('aria-label',sound?'Mute sound':'Enable sound');
    button.title=sound?'Voice and sound on':'Enable recorded voice and sound';
    button.querySelector('path').setAttribute('d',sound?'M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14':'M3 9h4l5-4v14l-5-4H3zM17 9l5 6m0-6l-5 6');
  }
  function syntaxLine(event){
    const line=document.createElement('span');line.className='event-line';line.dataset.type=event.type;
    const text=eventLine(event);
    const tokens=/"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null|\d+)\b/g;
    let offset=0;
    for(const match of text.matchAll(tokens)){
      line.append(document.createTextNode(text.slice(offset,match.index)));
      const token=document.createElement('span');
      token.className=text[match.index+match[0].length]===':'?'json-key':match[0].startsWith('"')?'json-value':'json-number';
      token.textContent=match[0];line.append(token);offset=match.index+match[0].length;
    }
    line.append(document.createTextNode(text.slice(offset)+'\n'));return line;
  }
  function drawEvents(force=false){
    const events=[...eventsAt(clock.seconds),...speechEventsAt(clock.seconds),...localEvents.filter(e=>e.at<=clock.seconds)].sort((a,b)=>a.at-b.at);
    if(!force&&events.length===eventCount)return;
    eventCount=events.length;
    const log=q('[data-event-log]');log.replaceChildren(...events.map(syntaxLine));
    const stream=log.parentElement;stream.scrollTop=stream.scrollHeight;
  }
  function renderConversation(){
    const turn=conversationAt(clock.seconds),panel=q('[data-speech-input]');
    panel.hidden=!turn;panel.dataset.phase=turn?.phase||'hidden';
    root.dataset.speaking=String(Boolean(turn?.held));
    if(turn){
      const status=turn.held?'You · holding mic':turn.phase==='submitted'?'You · sent voice message':'You · Boop heard you';
      q('[data-speech-status]').textContent=status;
      const transcript=q('[data-speech-transcript]');
      if(transcript.textContent!==turn.transcript)transcript.textContent=turn.transcript;
      q('[data-speech-feedback]').textContent=turn.held?'Scripted voice · listening…':turn.phase==='submitted'?'Mic released · transcript added to log':'Boop’s mood → '+title(storyStep().mood);
    }
    // The same recorded words remain legible in a muted demo. No invented TTS.
    const step=storyStep(),bubble=q('[data-voice-bubble]');
    if(!sound){
      const visible=step.responseText&&clock.seconds<step.at+3.5;
      bubble.hidden=!visible;bubble.textContent=visible?step.responseText:'';
    }
  }
  function renderStep(silent=false){
    const index=stepAt(clock.seconds),step=STORY[index];
    if(index!==activeStep){
      stopSound();
      activeStep=index;temporary=false;clearTimeout(touchTimer);
      q('[data-state]').textContent=step.state;q('[data-mood]').textContent=title(step.mood);
      q('[data-allow]').hidden=step.pixelState!=='needs_you';
      q('[data-interaction]').textContent=defaultHint();
      if(api){
        if(character==='pixel')api.setState({mood:step.mood,state:step.pixelState});
        else{
          api.setEmotion(step.mood);
          if(!reduced.matches&&clock.playing){
            if(step.interaction==='tap')api.poke();
            else if(step.interaction==='tap_spam')api.shake();
            else api.perform(index%3);
          }
        }
      }
      if(!silent)playMoment(step);
    }
    renderConversation();drawEvents();renderTransport();
  }
  function renderTransport(){
    const second=Math.floor(clock.seconds);
    if(second!==progressSecond){
      progressSecond=second;q('[data-position]').value=String(second);
      q('[data-position]').setAttribute('aria-valuetext',format(second)+' of 4 minutes');
      q('[data-time]').textContent=format(second)+' / 4:00';
    }
    q('[data-play]').textContent=clock.ended?'Replay':requestedPlay?'Pause':'Play';
    q('[data-play]').setAttribute('aria-label',clock.ended?'Replay demo':requestedPlay?'Pause demo':'Play demo');
  }
  function syncPlayback(){
    const playing=Boolean(api&&requestedPlay&&inView&&!document.hidden&&!clock.ended);
    if(playing)clock.play();else clock.pause();
    root.dataset.playing=String(playing);
    setPaused(!inView||document.hidden||(!requestedPlay&&!temporary));
    if(!playing)stopSound();
    lastStamp=0;renderConversation();renderTransport();
  }
  function seek(seconds){
    stopSound();
    clearTimeout(touchTimer);temporary=false;activeStep=-1;
    clock.seek(seconds);renderStep(true);syncPlayback();
  }
  function attach(){
    api=character==='pixel'?frame.contentWindow.pixelPreview:frame.contentWindow.slimePreview;
    if(!api){q('[data-interaction]').textContent='Preview unavailable. Reload to try again.';return;}
    root.dataset.ready='true';q('[data-loading]').hidden=true;
    activeStep=-1;renderStep(true);syncPlayback();
  }
  frame.addEventListener('load',attach);
  if(frame.contentWindow?.pixelPreview)attach();
  function touch(kind){
    if(!api)return;
    clearTimeout(touchTimer);temporary=true;
    if(character==='slime')api.setEmotion(storyStep().mood);
    setPaused(false);
    localEvents.push({at:Math.floor(clock.seconds),source:'code',type:'interaction.'+kind});
    drawEvents(true);
    if(!voice.stats().playing&&!voice.stats().pending){
      playSound(kind==='drag'?'squish':'poke');
      if(!['needs_you','listening'].includes(storyStep().pixelState))recordedLine('phase1.word.poke.hi__'+storyStep().mood+'__contained');
    }
    q('[data-interaction]').textContent=kind==='drag'?'A little stretch. Back to the task.':'Boop! Still keeping you company.';
    const hold=character==='pixel'?Math.max(2000,api.getState().transient?6000:1800):1800;
    touchTimer=setTimeout(()=>{temporary=false;q('[data-interaction]').textContent=defaultHint();syncPlayback();},hold);
  }
  document.addEventListener('buddy-interaction',event=>{if(character==='pixel')touch(event.detail.kind);});
  document.addEventListener('boop-interaction',event=>{if(character==='slime')touch(event.detail.kind);});
  q('[data-play]').addEventListener('click',()=>{
    if(clock.ended){localEvents.length=0;requestedPlay=true;seek(0);}
    else{requestedPlay=!requestedPlay;syncPlayback();}
  });
  q('[data-position]').addEventListener('input',event=>seek(Number(event.target.value)));
  q('[data-sound]').addEventListener('click',()=>{
    sound=!sound;renderSound();
    if(sound){playSound();playMoment(storyStep());}else stopSound();
  });
  q('[data-allow]').addEventListener('click',()=>{requestedPlay=true;seek(136);});
  q('[data-character-switch]').addEventListener('change',event=>{
    stopSound();setPaused(true);clock.pause();api=null;clearTimeout(touchTimer);temporary=false;
    character=event.target.value;root.dataset.character=character;root.dataset.ready='false';
    q('[data-loading]').hidden=false;q('[data-interaction]').textContent=defaultHint();
    frame.title=character==='pixel'?'Buddygotchi pixel buddy: click to poke':'Boop slime: tap or drag to interact';
    frame.src=character==='pixel'?'/assets/pixel-buddy/':'/assets/boop-preview/';
    lastStamp=0;
  });
  document.addEventListener('visibilitychange',syncPlayback);
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncPlayback();},{threshold:.2}).observe(root);
  reduced.addEventListener('change',()=>{if(reduced.matches){requestedPlay=false;syncPlayback();}});
  function tick(stamp){
    if(clock.playing){
      if(lastStamp)clock.advance(Math.min(.25,(stamp-lastStamp)/1000));
      lastStamp=stamp;renderStep();
      if(clock.ended){requestedPlay=false;syncPlayback();}
    }else lastStamp=0;
    requestAnimationFrame(tick);
  }
  renderSound();renderStep(true);requestAnimationFrame(tick);
  window.landingDemo={getState:()=>({seconds:clock.seconds,character,sound,playing:clock.playing,conversation:conversationAt(clock.seconds),voice:{...voice.stats(),...voiceStatus,mouthTransitions,audioState:voice.audioContext?.state||'not-started'}})};
}
