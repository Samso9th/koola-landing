// Export the approved self-contained SVG compositions through the browser.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
 const dir = path.resolve(__dirname, '../public/brand');
 const browser = await chromium.launch();
 try {
  const page = await browser.newPage({deviceScaleFactor:1});
  for (const [size,name] of [[32,'favicon.png'],[180,'apple-touch-icon.png'],[192,'icon-192.png'],[512,'icon-512.png']]) {
   const isFavicon = name === 'favicon.png';
   const source = isFavicon ? 'favicon.svg' : 'app-icon.svg';
   await page.setViewportSize({width:size,height:size});
   await page.setContent(`<style>body{margin:0;background:${isFavicon ? 'transparent' : '#F6EFE4'}}svg{display:block;width:100vw;height:100vh}</style>${fs.readFileSync(path.join(dir,source),'utf8')}`);
   await page.evaluate(()=>Promise.all([...document.querySelectorAll('image')].map(el=>new Promise((res,rej)=>{const im=new Image();im.onload=res;im.onerror=rej;im.src=el.getAttribute('href')}))));
   await page.screenshot({path:path.join(dir,name),omitBackground:isFavicon});
  }
  await page.setViewportSize({width:1200,height:630});
  await page.setContent(`<style>body{margin:0;background:#F6EFE4;display:grid;place-items:center;width:1200px;height:630px}svg{width:1000px;height:auto}</style>${fs.readFileSync(path.join(dir,'logo-horizontal.svg'),'utf8')}`);
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('image')].map(el=>new Promise((res,rej)=>{const im=new Image();im.onload=res;im.onerror=rej;im.src=el.getAttribute('href')}))));
  await page.screenshot({path:path.join(dir,'koola-og.png')});
  console.log('Exported favicon, Apple/app icons and sharing image from approved artwork.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
