import * as snarkjs from "snarkjs";
import { readFileSync } from "node:fs";
const input = JSON.parse(readFileSync("public/zk/demo-input.json","utf8"));
const wasm = "public/zk/poolpass.wasm";
const zkey = "public/zk/poolpass_final.zkey";
const vk = JSON.parse(readFileSync("public/zk/verification_key.json","utf8"));
const times=[];
for (let i=0;i<3;i++){
  const t0=performance.now();
  const wtns={type:"mem"};
  await snarkjs.wtns.calculate(input, wasm, wtns);
  const t1=performance.now();
  const {proof, publicSignals}=await snarkjs.groth16.prove(zkey, wtns);
  const t2=performance.now();
  const ok=await snarkjs.groth16.verify(vk, publicSignals, proof);
  const t3=performance.now();
  times.push({witness:Math.round(t1-t0),prove:Math.round(t2-t1),verify:Math.round(t3-t2),total:Math.round(t3-t0),ok});
  if(i===0) console.log("publicSignals:",publicSignals);
}
console.log(JSON.stringify(times,null,2));
const totals=times.map(t=>t.total).sort((a,b)=>a-b);
console.log("median total ms:", totals[1]);
