(function(root){
'use strict';const T=root.THREE;
// Expression layers are invisible at rest; the accepted neutral face is unchanged.
class FaceLaughAnimator{
 constructor(model){
  this.model=model;this.amount=0;this.lips=[];this.smile=model.head.getObjectByName('Smile line');
  for(const name of ['Cupid upper lip','Soft lower lip']){const mesh=model.head.getObjectByName(name),g=mesh.geometry,p=g.attributes.position,a=new Float32Array(p.array.length),upper=name==='Cupid upper lip';for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),edge=Math.pow(Math.max(0,1-(x/.405)**2),.8),dy=(upper?.025:-.25)*edge;a[i*3+1]=dy;a[i*3+2]=model.faceZ(x,y+dy)-model.faceZ(x,y);}g.morphTargetsRelative=true;const target=new T.Float32BufferAttribute(a,3);target.name='laughOpen';g.morphAttributes.position=[target];mesh.updateMorphTargets();this.lips.push(mesh);}
  const material=(color)=>new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide});
  this.layers=[];
  for(const [name,color] of [['Laugh mouth interior','#3e1620'],['Laugh upper teeth','#fff2dd'],['Laugh tongue','#bb5260']]){let g=new T.BufferGeometry(),nx=64,ny=8,indices=[];g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array((nx+1)*(ny+1)*3),3));for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,b=a+nx+1;indices.push(a,a+1,b,b,a+1,b+1);}g.setIndex(indices);let mesh=new T.Mesh(g,material(color));mesh.name=name;mesh.visible=false;model.head.add(mesh);this.layers.push(mesh);}
  this.closedEyes=[];
  for(const s of [-1,1]){const points=[];for(let i=0;i<=24;i++){let u=-1+i/12,x=s*.46+u*.215,y=.344+.045*(1-u*u);points.push(new T.Vector3(x,y,model.faceZ(x,y)+.035));}const g=new T.TubeGeometry(new T.CatmullRomCurve3(points),36,.012,8,false),eye=new T.Mesh(g,material('#30261f'));eye.name='Laugh closed eyelid';eye.visible=false;model.head.add(eye);this.closedEyes.push(eye);}
 }
 apply(amount,eyeClosure=amount){
  amount=T.MathUtils.clamp(amount,0,1);eyeClosure=T.MathUtils.clamp(eyeClosure,0,1);
  for(const lip of this.lips)lip.morphTargetInfluences[0]=amount;
  this.smile.visible=amount<.025;
  for(let k=0;k<this.layers.length;k++){let mesh=this.layers[k];mesh.visible=amount>.025;if(!mesh.visible)continue;let p=mesh.geometry.attributes.position;for(let j=0;j<=8;j++)for(let i=0;i<=64;i++){let u=-1+i/32,x=u*(k===2?.24:.405),edge=Math.pow(Math.max(0,1-(x/.405)**2),.8),line=-.61+.050*Math.pow(Math.abs(x/.405),1.7),top=line+.025*edge*amount,bottom=line-.25*edge*amount;
   if(k===1)bottom=top-.060*edge*amount;
   if(k===2){bottom+=.014*amount;top=bottom+.045*Math.sqrt(Math.max(0,1-u*u))*amount;}
   let y=top+(bottom-top)*j/8,z=this.model.faceZ(x,y)+(k===0?.016:.023);p.setXYZ(j*65+i,x,y,z);
  }p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();}
  const closed=eyeClosure>.80;for(const eye of this.model.eyes)eye.visible=!closed;for(const eye of this.closedEyes)eye.visible=closed;
  this.amount=amount;
 }
 reset(){this.apply(0,0);for(const eye of this.model.eyes)eye.scale.y=1;}
}
root.FaceLaughAnimator=FaceLaughAnimator;
})(globalThis);
