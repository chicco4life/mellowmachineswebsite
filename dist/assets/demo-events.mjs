// A readable authored fixture, not a captured agent transcript.
export const EVENTS = [
  {at:0,source:'agent',type:'session.start',task:'Add keyboard shortcuts'},
  {at:1,source:'user',type:'input',text:'Keep typing and focus behavior intact'},
  {at:3,source:'user',type:'interaction.tap',scripted:true},
  {at:6,source:'jev',type:'choice',mood:'curious',state:'planning'},
  {at:16,source:'agent',type:'tool.call',tool:'Read',file:'editor.tsx'},
  {at:18,source:'tool',type:'tool.result',tool:'Read',status:'ok',lines:86},
  {at:24,source:'agent',type:'tool.call',tool:'Read',file:'commands.ts'},
  {at:28,source:'tool',type:'tool.result',tool:'Read',status:'ok',lines:42},
  {at:30,source:'user',type:'interaction.tap',count:3,scripted:true},
  {at:34,source:'agent',type:'plan',steps:['listener','editable guard','tests']},
  {at:44,source:'agent',type:'tool.call',tool:'Edit',file:'useShortcuts.ts'},
  {at:49,source:'tool',type:'tool.result',tool:'Edit',status:'ok'},
  {at:50,source:'user',type:'interaction.tap',scripted:true},
  {at:55,source:'agent',type:'tool.call',tool:'Edit',file:'shortcuts.test.ts'},
  {at:60,source:'tool',type:'tool.result',tool:'Edit',status:'ok'},
  {at:88,source:'agent',type:'tool.call',tool:'Bash',cmd:'npm test -- shortcuts'},
  {at:91,source:'tool',type:'tool.result',tool:'Bash',exit:1,error:'editable target'},
  {at:91.1,source:'jev',type:'choice',mood:'annoyed',state:'error'},
  {at:92,source:'agent',type:'tool.call',tool:'Read',file:'editor.tsx',focus:'nested editable'},
  {at:99,source:'agent',type:'tool.call',tool:'Edit',fix:'closest editable ancestor'},
  {at:111,source:'agent',type:'permission.request',action:'Install browser test runner'},
  {at:112,source:'code',type:'attention.show',state:'needs_you'},
  {at:126,source:'agent',type:'waiting',reason:'permission'},
  {at:136,source:'user',type:'permission.granted'},
  {at:143,source:'user',type:'interaction.tap',scripted:true},
  {at:147,source:'agent',type:'tool.call',tool:'Bash',cmd:'npm run test:browser'},
  {at:150,source:'user',type:'mode.change',mode:'quiet',scripted:true},
  {at:158,source:'tool',type:'test.progress',passed:8,total:12},
  {at:169,source:'tool',type:'test.progress',passed:11,total:12},
  {at:180,source:'tool',type:'tool.result',tool:'Bash',exit:0,passed:12},
  {at:185,source:'user',type:'interaction.tap',scripted:true},
  {at:191,source:'agent',type:'subagent.start',id:'reviewer',task:'Review diff and cleanup'},
  {at:201,source:'subagent',type:'subagent.result',id:'reviewer',result:'Listener cleanup verified'},
  {at:212,source:'agent',type:'summary',files:2,tests:'passed'},
  {at:224,source:'agent',type:'task.complete',status:'ready for review'},
  {at:225,source:'jev',type:'choice',mood:'proud',state:'task_complete'},
  {at:234,source:'code',type:'state',state:'idle',mood:'calm'},
  {at:238,source:'code',type:'state',state:'asleep'},
];
export const eventsAt=seconds=>EVENTS.filter(e=>e.at<=seconds);
export function eventLine(event) {
  const {at,...body}=event;
  const ts=Math.floor(at/60)+':'+String(Math.floor(at%60)).padStart(2,'0');
  return JSON.stringify({ts,...body});
}
