(function(root){
'use strict';const T=root.THREE;
class SoftFaceDeformer{
 constructor(meshes,head){this.head=head;this.effects=new Map();this.dirty=false;head.updateWorldMatrix(true,true);let inverse=head.matrixWorld.clone().invert();this.surfaces=meshes.map(mesh=>{const matrix=new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),back=matrix.clone().invert(),local=mesh.geometry.attributes.position.array.slice(),positions=new Float32Array(local.length),p=new T.Vector3();for(let i=0;i<local.length;i+=3){p.fromArray(local,i).applyMatrix4(matrix);p.toArray(positions,i);}return {mesh,matrix,back,local,positions,normals:mesh.geometry.attributes.normal.array.slice(),smoothReferenceNormals:mesh.geometry.userData.smoothDeformationReference};});}
 begin(id,anchor,normal,radius=.48,weightMask=null){if(this.effects.has(id))this.effects.delete(id);let effect={anchor:anchor.clone(),normal:normal.clone(),radius,current:new T.Vector3(),target:normal.clone().multiplyScalar(-.30),velocity:new T.Vector3(),released:false,weights:this.surfaces.map(surface=>{let w=new Float32Array(surface.positions.length/3),p=surface.positions;for(let i=0;i<p.length;i+=3){let dx=p[i]-anchor.x,dy=p[i+1]-anchor.y,dz=p[i+2]-anchor.z,d=(dx*dx+dy*dy+dz*dz)/(radius*radius);const mask=weightMask?T.MathUtils.clamp(weightMask(p[i],p[i+1],p[i+2]),0,1):1;w[i/3]=d>4?0:Math.exp(-d*2.15)*mask;}return w;})};this.effects.set(id,effect);this.dirty=true;return effect;}
 target(id,delta){let e=this.effects.get(id);if(e){e.target.copy(delta);e.target.clampLength(0,1.25);this.dirty=true;}}
 release(id){let e=this.effects.get(id);if(e){e.released=true;e.target.set(0,0,0);this.dirty=true;}}
 releaseAll(){for(let id of this.effects.keys())this.release(id);}
 reset(){this.effects.clear();for(let s of this.surfaces){s.mesh.geometry.attributes.position.array.set(s.local);s.mesh.geometry.attributes.position.needsUpdate=true;s.mesh.geometry.attributes.normal.array.set(s.normals);s.mesh.geometry.attributes.normal.needsUpdate=true;s.mesh.geometry.computeBoundingSphere();}this.dirty=false;}
 // Dudu opts into smooth implicit normals; other characters keep their normal path.
 updateNormals(s,active){
  const geometry=s.mesh.geometry,reference=s.smoothReferenceNormals;
  if(reference&&!active){geometry.attributes.normal.array.set(s.normals);geometry.attributes.normal.needsUpdate=true;return;}
  geometry.computeVertexNormals();const normals=geometry.attributes.normal.array;
  const from=reference?new T.Vector3():null,to=reference?new T.Vector3():null,smooth=reference?new T.Vector3():null,rotation=reference?new T.Quaternion():null;
  for(let i=0;i<normals.length;i+=3){
   if(normals[i]*normals[i]+normals[i+1]*normals[i+1]+normals[i+2]*normals[i+2]<.1){normals[i]=s.normals[i];normals[i+1]=s.normals[i+1];normals[i+2]=s.normals[i+2];}
   else if(reference){from.fromArray(reference,i);to.fromArray(normals,i);if(from.lengthSq()>.1){rotation.setFromUnitVectors(from.normalize(),to.normalize());smooth.fromArray(s.normals,i).applyQuaternion(rotation).normalize().toArray(normals,i);}}
  }
 }
 step(dt){if(!this.effects.size&&!this.dirty)return false;let sub=Math.ceil(dt/.012),h=dt/sub;for(let [id,e] of this.effects){for(let i=0;i<sub;i++){e.velocity.addScaledVector(e.target.clone().sub(e.current),185*h);e.velocity.multiplyScalar(Math.exp(-15*h));e.current.addScaledVector(e.velocity,h);}if(e.released&&e.current.lengthSq()<1e-8&&e.velocity.lengthSq()<1e-6)this.effects.delete(id);}
  const effects=[...this.effects.values()],p=new T.Vector3();for(let k=0;k<this.surfaces.length;k++){let s=this.surfaces[k],out=s.mesh.geometry.attributes.position,a=s.positions;for(let i=0;i<a.length;i+=3){let dx=0,dy=0,dz=0,total=0;for(let e of effects){let w=e.weights[k][i/3];if(w<.0001)continue;dx+=e.current.x*w;dy+=e.current.y*w;dz+=e.current.z*w;total+=w;}let normalizer=Math.max(1,total);p.set(a[i]+dx/normalizer,a[i+1]+dy/normalizer,a[i+2]+dz/normalizer).applyMatrix4(s.back);out.setXYZ(i/3,p.x,p.y,p.z);}out.needsUpdate=true;this.updateNormals(s,effects.length>0);s.mesh.geometry.computeBoundingSphere();}this.dirty=this.effects.size>0;return true;
 }
}
root.SoftFaceDeformer=SoftFaceDeformer;
})(globalThis);
