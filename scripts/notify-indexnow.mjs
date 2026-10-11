import {readFile,mkdir,writeFile} from 'node:fs/promises';

// Notify participating engines after deployment. This does not request Google indexing.
const root=new URL('../',import.meta.url);
const site=JSON.parse(await readFile(new URL('content/site.json',root),'utf8'));
const guides=JSON.parse(await readFile(new URL('content/articles.json',root),'utf8'));
if(site.origin!=='https://mellowmachines.com') throw new Error('Unexpected production origin.');
const key=site.indexNowKey;
if(!/^[a-f0-9]{32}$/.test(key)) throw new Error('Missing public IndexNow ownership key.');
const routes=['/','/learn/',...guides.filter(g=>!g.canonical&&g.updated===site.updated).map(g=>g.path)];
if(site.productUpdated===site.updated) routes.push('/buddygotchi/');
const urlList=[...new Set(routes)].map(path=>new URL(path,site.origin).href);
const keyLocation=new URL('/'+key+'.txt',site.origin).href;
const payload={host:new URL(site.origin).hostname,key,keyLocation,urlList};
if(!process.argv.includes('--submit')){
 console.log(JSON.stringify({dryRun:true,release:site.updated,urlList},null,2));
 console.log('After the release is live: npm run notify:indexnow -- --submit');
}else{
 // Never submit URLs or a key that exist only in a local build.
 const keyResponse=await fetch(keyLocation,{signal:AbortSignal.timeout(15000)});
 if(!keyResponse.ok||(await keyResponse.text()).trim()!==key) throw new Error('Ownership file is not deployed.');
 for(const url of urlList){
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok||response.url!==url) throw new Error('URL is not live at its canonical location: '+url);
  const html=await response.text();
  if(!html.includes('href="'+url+'"')||/name="robots"[^>]*content="[^"]*noindex/i.test(html)) throw new Error('URL is not an indexable canonical page: '+url);
  if(url.includes('/learn/')&&url!==site.origin+'/learn/'&&!html.includes('"dateModified":"'+site.updated+'"')) throw new Error('Article release is not live: '+url);
 }
 const response=await fetch('https://api.indexnow.org/indexnow',{
  method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},
  body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)
 });
 const result={submittedAt:new Date().toISOString(),release:site.updated,status:response.status,urlList,
  meaning:response.status===200?'Notification received; indexing is not guaranteed.':response.status===202?'Notification received; ownership validation pending.':'Submission failed; inspect the response before retrying.',
  response:(await response.text()).slice(0,1000)};
 await mkdir(new URL('outputs/',root),{recursive:true});
 await writeFile(new URL('outputs/indexnow-result.json',root),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 if(![200,202].includes(response.status)) process.exitCode=1;
}
