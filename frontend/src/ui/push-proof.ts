// The code identifies a binding for this one check. It is not an authorization credential.
export async function makeVerificationCode(bindingId:string, nonceBytes=crypto.getRandomValues(new Uint8Array(8))):Promise<string>{
 if(!/^[a-f0-9]{64}$/.test(bindingId)||nonceBytes.length!==8)throw Error('INVALID');
 const hex=(a:Uint8Array)=>Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
 const nonce=hex(nonceBytes),input=new TextEncoder().encode('zameny-device-check-v1:'+nonce+':'+bindingId);
 const digest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',input))).slice(0,24);
 return `${nonce}-${digest}`;
}
