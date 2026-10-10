import {readFile,writeFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
const modulePath=process.argv[2];
const {marked}=await import(modulePath?pathToFileURL(modulePath).href:"marked");
const root=new URL("../",import.meta.url);
const markdown=(await readFile(new URL("content/mellowharness.md",root),"utf8")).replaceAll("](assets/","](/assets/");
await writeFile(new URL("content/technical-overview.html",root),marked.parse(markdown,{gfm:true}));
await import("./build.mjs");
console.log("Preserved technical article rendered with the current site layout.");
