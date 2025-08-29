import { writeFile } from 'node:fs/promises'

// little helpers
const l16 = v => String.fromCharCode(v & 0xff) + String.fromCharCode((v >> 8) & 0xff)
const ab = (h,l) => l16(((h&0xff)<<8)|(l&0xff))
const tobuf = s => Buffer.from([...s].map(c=>c.charCodeAt(0)))

// opcodes stuff
const o = {
  ax: v => "\xb8"+l16(v),
  bx: v => "\xbb"+l16(v),
  cx: v => "\xb9"+l16(v),
  sp: ()=>"\x89\xc4",
  ss: ()=>"\x8e\xd0",
  ds: ()=>"\x8e\xd8",
  es: ()=>"\x8e\xc0",
  int10: ()=>"\xcd\x10",
  cli: ()=>"\xfa",
  hlt: ()=>"\xf4",
  loop: ()=>"\xeb\xfe",
  pad: n=>"\x90".repeat(n),
  sig: ()=>l16(0xaa55),
  clear: ()=>o.ax(0x0003)+o.int10(),
  pr: s => (s+"\r\n").split('').map(ch=>o.ax(((0x0e<<8)|(ch.charCodeAt(0)&0xff)))+o.int10()).join('')
}

const make = m => {
  let c = ''
  c += o.ax(0x0000)
  c += o.ds()
  c += o.es()
  c += o.ss()
  c += o.ax(0x7c00)
  c += o.sp()
  c += o.clear()
  c += o.bx(0x0000)
  c += o.pr(m)
  c += o.cli()
  c += o.hlt()
  c += o.loop()
  let p = 510-c.length
  if(p<0) throw new Error('too long')
  return tobuf(c+o.pad(p)+o.sig())
}

let f = process.argv[2]
let msg = 'seven stars servers says hi'
if(!f){
  console.error('usage: node main.js file')
  process.exit(1)
}

let sec = make(msg)
await writeFile(f,sec)
console.log('wrote',sec.length,'bytes to',f)
