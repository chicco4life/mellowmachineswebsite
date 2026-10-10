// Authored voice interactions. No microphone access, ASR or model requests.
export const CONVERSATIONS=Object.freeze([
  {id:'challenge',start:8,submittedAt:10,reactAt:10.25,hideAt:19,text:"You suck at this. You've got to up your game!",responseMood:'determined',responseState:'working'},
  {id:'criticism',start:19,submittedAt:20.5,reactAt:20.75,hideAt:34,text:'You really suck. Come on, get working!',responseMood:'grumpy',responseState:'working'},
  {id:'impatient',start:58,submittedAt:59.5,reactAt:59.75,hideAt:67,text:'Still not done? Come on, Boop!',responseMood:'whiny',responseState:'working'},
  {id:'comfort',start:67,submittedAt:70,reactAt:70.25,hideAt:88,text:"Hey, I was too harsh. You're doing fine. Take your time.",responseMood:'calm',responseState:'working'},
  {id:'suggestion',start:94,submittedAt:95.5,reactAt:95.75,hideAt:105,text:'Try checking the editable parent. You can do this.',responseMood:'determined',responseState:'working'}
]);
export function conversationAt(seconds){
  const turn=CONVERSATIONS.find(c=>seconds>=c.start&&seconds<c.hideAt);
  if(!turn)return null;
  const held=seconds<turn.submittedAt;
  const words=turn.text.split(' ');
  const progress=Math.max(0,Math.min(1,(seconds-turn.start-.1)/(turn.submittedAt-turn.start-.2)));
  const transcript=held?words.slice(0,Math.ceil(progress*words.length)).join(' '):turn.text;
  return {...turn,held,transcript,phase:held?'recording':seconds<turn.reactAt?'submitted':'reacted'};
}
export function speechEventsAt(seconds){
  const events=[];
  for(const c of CONVERSATIONS){
    if(seconds>=c.start)events.push({at:c.start,source:'user',type:'voice.start',mic:'held',scripted:true});
    if(seconds>=c.submittedAt)events.push({at:c.submittedAt,source:'user',type:'voice.end',mic:'released',scripted:true},{at:c.submittedAt,source:'user',type:'input',modality:'voice',text:c.text,scripted:true});
    if(seconds>=c.reactAt)events.push({at:c.reactAt,source:'jev',type:'choice',mood:c.responseMood,state:c.responseState,context:'user voice',scripted:true});
  }
  return events;
}
