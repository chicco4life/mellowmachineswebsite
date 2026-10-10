import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Authoring only: the deployed site serves the generated HTML without dependencies.
const modulePath=process.argv[2];
const {marked}=await import(modulePath?pathToFileURL(modulePath).href:'marked');
const root=new URL('../',import.meta.url);
const guides=JSON.parse(await readFile(new URL('content/articles.json',root),'utf8'));
for(const guide of guides.filter(g=>g.markdown)){
 const text=await readFile(new URL(guide.markdown,root),'utf8');
 await writeFile(new URL(guide.body,root),marked.parse(text,{gfm:true}));
}
console.log('Rendered maintained Markdown guides; preserved the historical article.');
