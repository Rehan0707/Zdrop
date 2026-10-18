import assert from 'node:assert/strict';
const base = process.env.ZDROP_TEST_URL || 'http://localhost:3000';
for (const route of ['/api/sessions/create','/api/auth/shop/login','/api/auth/shop/register']) {
  for (const body of ['null','[]','{bad']) {
    const response = await fetch(base+route,{method:'POST',body,headers:{'Content-Type':'application/json'}});
    assert.equal(response.status,400,route+' rejects malformed JSON');
  }
  const body = new ReadableStream({start(controller){ controller.enqueue(new TextEncoder().encode('{"padding":"'+'x'.repeat(17000)+'"}'));controller.close(); }});
  const response = await fetch(base+route,{method:'POST',body,duplex:'half',headers:{'Content-Type':'application/json'}});
  assert.equal(response.status,413,route+' bounds streamed request bodies');
}
for (const target of ['https://example.test/','//example.test/']) {
  const response = await fetch(base+'/api/auth/google?redirect='+encodeURIComponent(target),{redirect:'manual'});
  const destination = new URL(response.headers.get('location'));
  const requested = new URL(base);
  assert.ok(destination.origin === requested.origin || destination.hostname === 'localhost' && requested.hostname === '127.0.0.1' && destination.port === requested.port && destination.protocol === requested.protocol);
}
const response = await fetch(base+'/api/auth/callback?redirect='+encodeURIComponent('/?x=</script><script>unsafe()</script>'));
const html = await response.text();
assert.ok(!html.includes('<script>unsafe()'));
assert.equal(response.headers.get('cache-control'),'no-store');
const png = Buffer.alloc(24);
png.set([137,80,78,71,13,10,26,10]); png.writeUInt32BE(1,16); png.writeUInt32BE(1,20);
const createdRes = await fetch(base+'/api/sessions/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({files:[{fileName:'fake.png',fileSize:png.length,mimeType:'image/png'}],preferences:{copies:1}})});
assert.equal(createdRes.status,201);
const created = await createdRes.json();
const uploaded = await fetch(`${base}/api/sessions/upload?sessionId=${created.session.id}&fileId=${created.session.files[0].fileId}`,{method:'POST',headers:{Authorization:`Bearer ${created.token}`},body:png});
assert.equal(uploaded.status,400,'A matching header alone does not make an image printable.');
assert.equal((await fetch(base+'/api/sessions/delete',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${created.token}`},body:JSON.stringify({sessionId:created.session.id})})).status,200);
console.log('PASS: malformed/oversized streamed JSON rejection, same-origin auth redirects, callback script escaping and no-store headers.');
