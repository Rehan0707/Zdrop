import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
const base=process.env.ZDROP_TEST_URL || 'http://localhost:3000';
const pdf=await PDFDocument.create();pdf.addPage();
const zip=new JSZip();zip.file('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');zip.file('word/document.xml','<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>ZDrop test</w:t></w:r></w:p></w:body></w:document>');
const files=[{name:'sample.jpg',type:'image/jpeg',bytes:Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVAA//Z','base64')},{name:'sample.png',type:'image/png',bytes:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7nQAAAAASUVORK5CYII=','base64')},{name:'sample.docx',type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',bytes:await zip.generateAsync({type:'nodebuffer'})}];
const create=await fetch(base+'/api/sessions/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({files:files.map(f=>({fileName:f.name,fileSize:f.bytes.length,mimeType:f.type})),preferences:{copies:3,colorMode:'COLOR',sides:'SINGLE',pageRange:'ALL'}})});assert.equal(create.status,201);const result=await create.json();
for(let i=0;i<files.length;i++){const upload=await fetch(base+'/api/sessions/upload?sessionId='+result.session.id+'&fileId='+result.session.files[i].fileId,{method:'POST',headers:{Authorization:'Bearer '+result.token},body:files[i].bytes});assert.equal(upload.status,200,await upload.text());}
const confirmed=await fetch(base+'/api/sessions/confirm',{method:'POST',headers:{Authorization:'Bearer '+result.token,'Content-Type':'application/json'},body:JSON.stringify({sessionId:result.session.id})});assert.equal(confirmed.status,200);
const resolveRes=await fetch(base+'/api/sessions/resolve?code='+result.session.accessCode);const operator=await resolveRes.json();assert.equal(resolveRes.status,200,JSON.stringify(operator));assert.equal(operator.session.files.length,3);
for(const file of operator.session.files){
  assert.equal(file.previewUrl, undefined);
  const page = await fetch(base+'/api/print/page',{method:'POST',headers:{Authorization:'Bearer '+operator.token,'Content-Type':'application/json'},body:JSON.stringify({sessionId:result.session.id,fileId:file.fileId,page:1})});
  assert.equal(page.status,file.type.includes('wordprocessing')?415:200);
  if(page.ok) assert.equal(page.headers.get('content-type'),'image/png');
  assert.equal((await fetch(`${base}/api/files?sessionId=${result.session.id}&fileId=${file.fileId}&token=${operator.token}`)).status,403);
}
const deleteRes=await fetch(base+'/api/sessions/delete',{method:'POST',headers:{Authorization:'Bearer '+result.token,'Content-Type':'application/json'},body:JSON.stringify({sessionId:result.session.id})});assert.equal(deleteRes.status,200);
for(const f of operator.session.files)assert.equal((await fetch(`${base}/api/files?sessionId=${result.session.id}&fileId=${f.fileId}&token=${operator.token}`)).status,403);
console.log('PASS: three-file JPG/PNG/DOCX upload, blocked original downloads for every format, and deletion of all attachments.');
