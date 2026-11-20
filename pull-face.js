(function(root){
'use strict';const T=root.THREE;
// Additive expression morphs keep the accepted neutral sculpt and soft drag geometry intact.
class FacePullAnimator {
 constructor(model){
  this.amount=0;this.targets=[];
  const attach=(mesh,transform)=>{const g=mesh.geometry,p=g.attributes.position,deltas=new Float32Array(p.array.length);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=transform(x,y,z);deltas[i*3]=v[0]-x;deltas[i*3+1]=v[1]-y;deltas[i*3+2]=v[2]-z;}g.morphTargetsRelative=true;g.morphAttributes.position??=[];const index=g.morphAttributes.position.length,a=new T.Float32BufferAttribute(deltas,3);a.name='playfulScrunch';g.morphAttributes.position.push(a);mesh.updateMorphTargets();this.targets.push({mesh,index});};
  for(const name of ['Cupid upper lip','Soft lower lip','Smile line'])attach(model.head.getObjectByName(name),(x,y,z)=>{const u=Math.min(1,Math.abs(x)/.405),xx=x*.86,yy=y-.080*u*u+.009*(1-u*u),zz=z+model.faceZ(xx,yy)-model.faceZ(x,y)+.040*(1-u*u);return [xx,yy,zz];});
  model.head.traverse(mesh=>{if(mesh.name!=='Tapered eyebrow')return;attach(mesh,(x,y,z)=>{const side=Math.sign(x),inner=1-T.MathUtils.clamp((Math.abs(x)-.24)/.51,0,1),xx=x-side*.022*inner,yy=y+(side<0?-.025:.025)+.038*inner-.018*(1-inner);return [xx,yy,z+model.faceZ(xx,yy)-model.faceZ(x,y)];});});
 }
 apply(amount){this.amount=T.MathUtils.clamp(amount,0,1);for(const {mesh,index} of this.targets)mesh.morphTargetInfluences[index]=this.amount;}
 reset(){this.apply(0);}
}
root.FacePullAnimator=FacePullAnimator;
})(globalThis);
