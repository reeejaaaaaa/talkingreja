'use strict';
const assert=require('node:assert/strict');
global.THREE=require('../vendor/three.min.js');
require('../dudu.js');
require('../deform.js');
require('../model.js');
const T=THREE,model=MiniDudu.createCharacter();
assert.equal(typeof model.interactionRegion,'function');
assert.equal(typeof model.deformationMask,'function');
assert(model.bellyAnchor?.isVector3);
assert(model.softMeshes.includes(model.face),'The joined head/body must be deformable');
assert.equal(model.face.parent,model.head,'The joined body must share head motion to avoid a seam opening');
assert.equal(model.interactionRegion(model.bellyAnchor),'belly');

// Check actual triangle connectivity after welding coincident surface vertices.
// This catches a visually overlapping pile of disconnected primitives.
const positions=model.face.geometry.attributes.position,indices=model.face.geometry.index;
const welded=new Map(),ids=[],parents=[];
function find(a){while(parents[a]!==a){parents[a]=parents[parents[a]];a=parents[a];}return a;}
function join(a,b){parents[find(a)]=find(b);}
for(let i=0;i<positions.count;i++){
 const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);assert([x,y,z].every(Number.isFinite));
 const key=[x,y,z].map(n=>Math.round(n*100000)).join(',');
 if(!welded.has(key)){const id=parents.length;parents.push(id);welded.set(key,id);}
 ids.push(welded.get(key));
}
const triangleIndices=indices?indices.array:Array.from({length:positions.count},(_,i)=>i);
for(let i=0;i<triangleIndices.length;i+=3){join(ids[triangleIndices[i]],ids[triangleIndices[i+1]]);join(ids[triangleIndices[i]],ids[triangleIndices[i+2]]);}
assert.equal(new Set(parents.map((_,i)=>find(i))).size,1,'Head, body, arms and feet must be one connected surface');

const soft=new SoftFaceDeformer(model.softMeshes,model.head);
const saved=model.softMeshes.map(mesh=>mesh.geometry.attributes.position.array.slice());
const savedNormals=model.softMeshes.map(mesh=>mesh.geometry.attributes.normal.array.slice());
const smoothSurfaces=soft.surfaces.filter(surface=>surface.smoothReferenceNormals);
assert(smoothSurfaces.some(surface=>surface.mesh===model.face),'Dudu body must preserve its smooth surface shading during gestures');
const human=MiniRheza.createCharacter(),humanSoft=new SoftFaceDeformer(human.softMeshes,human.head);
assert(humanSoft.surfaces.every(surface=>!surface.smoothReferenceNormals),'Dudu smoothing must not opt Rheza into a different normal path');
function assertSmoothNormals(label,changed=false){
 let largestChange=0;
 for(const surface of smoothSurfaces){
  const current=surface.mesh.geometry.attributes.normal.array;
  for(let i=0;i<current.length;i+=3){
   const length=Math.hypot(current[i],current[i+1],current[i+2]);
   assert(Number.isFinite(length)&&Math.abs(length-1)<1e-5,label+': shading normals must remain finite and unit length');
   largestChange=Math.max(largestChange,Math.hypot(current[i]-surface.normals[i],current[i+1]-surface.normals[i+1],current[i+2]-surface.normals[i+2]));
  }
 }
 if(changed)assert(largestChange>.01,label+': lighting normals must follow the deformation rather than remain frozen');
}
function assertSmoothNormalsRestored(label){
 for(const surface of smoothSurfaces)assert.deepEqual(surface.mesh.geometry.attributes.normal.array,surface.normals,label+': smooth rest normals must be restored exactly');
}
assertSmoothNormals('Neutral body');
const anchor=model.bellyAnchor.clone(),normal=new T.Vector3(0,0,1),maskPoint=new T.Vector3();
const mask=(x,y,z)=>model.deformationMask(maskPoint.set(x,y,z),'belly');
let nearest=0,best=Infinity;
for(let i=0;i<positions.count;i++){
 const distance=new T.Vector3().fromBufferAttribute(positions,i).distanceToSquared(anchor);
 if(distance<best){best=distance;nearest=i;}
}
const originalNearest=new T.Vector3().fromBufferAttribute(positions,nearest);
const displacement=()=>new T.Vector3().fromBufferAttribute(positions,nearest).sub(originalNearest);
const settle=(frames)=>{for(let i=0;i<frames;i++)soft.step(1/60);};
function assertMaskedVerticesStill(){
 let fixed=0;
 for(const surface of soft.surfaces){const array=surface.mesh.geometry.attributes.position.array;
  for(let i=0;i<surface.positions.length;i+=3){const p=surface.positions;if(mask(p[i],p[i+1],p[i+2])!==0)continue;fixed++;
   assert(Math.abs(array[i]-surface.local[i])<1e-6&&Math.abs(array[i+1]-surface.local[i+1])<1e-6&&Math.abs(array[i+2]-surface.local[i+2])<1e-6,'Excluded surface vertices must stay fixed');
  }
 }
 assert(fixed>100,'The deformation mask must protect a substantial part of the surface');
 return fixed;
}
soft.begin('belly',anchor,normal,model.bellyRadius,mask);soft.target('belly',new T.Vector3(0,0,-.30));settle(70);
assert(displacement().z<-.20,'Press must visibly indent the belly');assertMaskedVerticesStill();
assertSmoothNormals('Belly press',true);
soft.target('belly',new T.Vector3(.80,.20,.12));settle(90);
assert(displacement().x>.55&&displacement().y>.13,'The belly must stretch toward a held pointer');
assertSmoothNormals('Belly pull',true);
const protectedVertices=assertMaskedVerticesStill();
soft.release('belly');settle(240);
assert.equal(soft.effects.size,0);
assertSmoothNormalsRestored('Settled belly pull');
for(let k=0;k<model.softMeshes.length;k++){
 const current=model.softMeshes[k].geometry.attributes.position.array;
 for(let i=0;i<current.length;i++)assert(Math.abs(current[i]-saved[k][i])<.00001,'Released body must return to neutral');
}
const left=anchor.clone().add(new T.Vector3(-.15,0,0)),right=anchor.clone().add(new T.Vector3(.15,0,0));
soft.begin('left',left,normal,model.bellyRadius,mask);soft.begin('right',right,normal,model.bellyRadius,mask);
soft.target('left',new T.Vector3(-.8,.15,.1));soft.target('right',new T.Vector3(.8,-.15,.1));settle(90);
for(const mesh of model.softMeshes)assert([...mesh.geometry.attributes.position.array].every(Number.isFinite),'Two-finger belly pinch must remain stable');
assertSmoothNormals('Two-finger pinch',true);
assertMaskedVerticesStill();soft.releaseAll();settle(240);assert.equal(soft.effects.size,0);
assertSmoothNormalsRestored('Settled two-finger pinch');
for(let k=0;k<model.softMeshes.length;k++){
 const current=model.softMeshes[k].geometry.attributes.position.array;
 for(let i=0;i<current.length;i++)assert(Math.abs(current[i]-saved[k][i])<.00001,'Two-finger pinch must restore neutral');
}
soft.begin('reset-check',anchor,normal,model.bellyRadius,mask);soft.target('reset-check',new T.Vector3(.60,-.12,.15));settle(12);
assertSmoothNormals('Active pull before reset',true);soft.reset();
assert.equal(soft.effects.size,0);assertSmoothNormalsRestored('Reset');
for(let k=0;k<model.softMeshes.length;k++)assert.deepEqual(model.softMeshes[k].geometry.attributes.normal.array,savedNormals[k],'Reset must restore all original normals');
console.log('Dudu belly geometry checks passed: continuous surface, press/stretch, '+protectedVertices+' masked vertices fixed, two pointers, smooth animated normals, exact recovery and unchanged Rheza normal path.');
