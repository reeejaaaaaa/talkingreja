(function(root){
'use strict';
const T=root.THREE;
const headProfile=[[-1.08,.025,.025],[-1.045,.52,.35],[-.98,.97,.57],[-.82,1.28,.73],[-.56,1.46,.82],[-.15,1.55,.86],[.33,1.50,.83],[.74,1.33,.73],[1.08,1.02,.56],[1.33,.59,.32],[1.43,.025,.025]];
function profileAt(profile,y){let k=0;while(k<profile.length-2&&y>profile[k+1][0])k++;const a=profile[k],b=profile[k+1],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1),v=[];for(let c=1;c<=2;c++){const prev=profile[Math.max(0,k-1)],next=profile[Math.min(profile.length-1,k+2)],m0=(b[c]-prev[c])/(b[0]-prev[0])*(b[0]-a[0]),m1=(next[c]-a[c])/(next[0]-a[0])*(b[0]-a[0]);v.push(Math.max(.025,(2*t*t*t-3*t*t+1)*a[c]+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*b[c]+(t*t*t-t*t)*m1));}return v;}
function faceZ(x,y){const [w,d]=profileAt(headProfile,y);return d*Math.pow(Math.max(.001,1-Math.pow(Math.abs(x/w),3)),1/3);}
function roundedSurface(profile,rings=96,sides=144){const p=[],ix=[],bottom=profile[0][0],height=profile[profile.length-1][0]-bottom;for(let j=0;j<=rings;j++){const y=bottom+j/rings*height,[w,d]=profileAt(profile,y);for(let i=0;i<=sides;i++){const a=(i/sides-.5)*Math.PI*2,s=Math.sin(a),c=Math.cos(a);p.push(w*Math.sign(s)*Math.pow(Math.abs(s),2/3),y,d*Math.sign(c)*Math.pow(Math.abs(c),2/3));}}for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){let a=j*(sides+1)+i,b=a+sides+1;ix.push(a,a+1,b,b,a+1,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;}
function createCharacter(){
 const group=new T.Group();group.name='Dudu — chubby bear';const head=new T.Group();head.name='Dudu head';head.position.y=.35;group.add(head);const softMeshes=[],eyes=[];
 const mat=(name,color,roughness=.92)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness:0});m.name=name;return m;};
 const fur=mat('Dudu warm biscuit fur','#d9a083'),dark=mat('Dudu cocoa outlines','#482820'),inner=mat('Dudu inner ears','#754336'),cheek=mat('Dudu golden blush','#ffcb77'),pink=mat('Dudu pink tongue','#ef7d91'),mouthDark=mat('Dudu mouth interior','#4b2427');
 function mesh(name,g,m,parent=head,soft=false){const o=new T.Mesh(g,m);o.name=name;o.castShadow=true;o.receiveShadow=false;parent.add(o);if(soft)softMeshes.push(o);return o;}
 function ell(name,m,pos,scale,parent=head,soft=false){const o=mesh(name,new T.SphereGeometry(1,48,32),m,parent,soft);o.position.set(...pos);o.scale.set(...scale);return o;}
 function curve(name,points,r,m,parent=head,soft=false){const o=mesh(name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,r,8,false),m,parent,soft);o.castShadow=false;return o;}
 // Round ears sit behind the broad cheeks and domed forehead.
 for(const s of [-1,1]){const ear=ell('Dudu round ear',fur,[s*1.12,1.13,-.05],[.34,.35,.22]);ear.rotation.z=-s*.24;const bowl=ell('Dudu inner ear',inner,[s*1.12,1.155,.19],[.225,.225,.028]);bowl.rotation.z=-s*.24;bowl.castShadow=false;}
 const face=mesh('Dudu soft head',roundedSurface(headProfile),fur,head,true);
 const names=['pressLeft','pressRight','noseBoop','stretchLeft','stretchRight'];face.geometry.morphTargetsRelative=true;face.geometry.morphAttributes.position=[];
 const p=face.geometry.attributes.position;
 for(let k=0;k<names.length;k++){const a=new Float32Array(p.array.length),side=k===0||k===3?-1:1,cx=k===2?0:side*1.02,cy=k===2?-.20:-.50,cz=faceZ(cx,cy),r=k===2?.28:.65;for(let i=0;i<p.count;i++){const dx=p.getX(i)-cx,dy=p.getY(i)-cy,dz=p.getZ(i)-cz,w=Math.exp(-(dx*dx+dy*dy+dz*dz)/(r*r)*2.3);if(k<3)a[i*3+2]=-.28*w;else{a[i*3]=side*.75*w;a[i*3+2]=.1*w;}}const attr=new T.Float32BufferAttribute(a,3);attr.name=names[k];face.geometry.morphAttributes.position.push(attr);}face.updateMorphTargets();
 // Flush color patches follow the curved head instead of floating as separate balls.
 function patch(name,cx,cy,rx,ry,material,parent=head,soft=false,zOffset=.012){const v=[],ix=[],nr=18,ns=64;for(let j=0;j<=nr;j++)for(let i=0;i<=ns;i++){const r=j/nr,a=i/ns*Math.PI*2,x=cx+rx*r*Math.cos(a),y=cy+ry*r*Math.sin(a);v.push(x,y,faceZ(x,y)+zOffset);}for(let j=0;j<nr;j++)for(let i=0;i<ns;i++){let a=j*(ns+1)+i,b=a+ns+1;ix.push(a,b,a+1,b,b+1,a+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();const o=mesh(name,g,material,parent,soft);o.castShadow=false;return o;}
 for(const s of [-1,1]){patch('Dudu golden cheek',s*1.04,-.48,.275,.285,cheek,head,true);const eye=new T.Group();eye.name=s<0?'Dudu left eye':'Dudu right eye';eye.position.set(s*.57,-.12,faceZ(s*.57,-.12)+.020);head.add(eye);eyes.push(eye);ell('Dudu dot eye',dark,[0,0,0],[.131,.140,.034],eye).castShadow=false;}
 // Tiny W smile and tongue are deliberately unlike the human character's lips.
 const neutralMouth=new T.Group();neutralMouth.name='Dudu neutral mouth';head.add(neutralMouth);
 patch('Dudu tongue outline',0,-.315,.125,.193,dark,neutralMouth,true,.019);
 patch('Dudu tongue',0,-.326,.087,.144,pink,neutralMouth,true,.027);
 const wSmile=[[-.15,-.135],[-.13,-.185],[-.078,-.205],[0,-.167],[.078,-.205],[.13,-.185],[.15,-.135]].map(([x,y])=>[x,y,faceZ(x,y)+.036]);curve('Dudu W smile',wSmile,.021,dark,neutralMouth,true);
 // A single round tan belly and short paws give Dudu his unclothed toy-bear silhouette.
 const torsoProfile=[[-2.18,.025,.025],[-2.12,.48,.34],[-1.98,.85,.55],[-1.77,1.055,.67],[-1.43,1.12,.71],[-1.12,1.015,.65],[-.86,.76,.52],[-.66,.43,.31]];
 const body=mesh('Dudu round bear belly',roundedSurface(torsoProfile,72,112),fur,group);body.position.z=-.035;
 for(const s of [-1,1]){
  const arm=ell('Dudu little bear arm',fur,[s*1.035,-1.29,.08],[.265,.395,.33],group);arm.rotation.z=s*.32;
  ell('Dudu short bear paw',fur,[s*.67,-2.05,.12],[.35,.27,.43],group);
 }
 // Expression shapes are prebuilt to share exactly the same soft cheek deformation.
 const laughMouth=new T.Group();laughMouth.name='Dudu laughing mouth';head.add(laughMouth);
 patch('Dudu laugh mouth outline',0,-.305,.265,.245,dark,laughMouth,true,.026);
 patch('Dudu laugh mouth opening',0,-.31,.228,.207,mouthDark,laughMouth,true,.034);
 patch('Dudu laugh tongue',0,-.40,.157,.085,pink,laughMouth,true,.044);
 const pullMouth=new T.Group();pullMouth.name='Dudu pouting mouth';head.add(pullMouth);curve('Dudu tiny pout',[[-.14,-.28],[-.075,-.24],[0,-.26],[.075,-.24],[.14,-.28]].map(([x,y])=>[x,y,faceZ(x,y)+.033]),.024,dark,pullMouth,true);
 const closedEyes=[];for(const s of [-1,1]){const points=[];for(let i=0;i<=18;i++){const u=-1+i/9,x=s*.57+u*.145,y=-.12+.065*(1-u*u);points.push([x,y,faceZ(x,y)+.032]);}closedEyes.push(curve('Dudu happy closed eye',points,.025,dark,head));}
 const pullBrows=[];for(const s of [-1,1]){const points=[];for(let i=0;i<=12;i++){const u=i/12,x=s*(.435+u*.26),y=.075+(s<0?-.018:.016)+.035*Math.sin(u*Math.PI);points.push([x,y,faceZ(x,y)+.022]);}pullBrows.push(curve('Dudu playful brow',points,.018,dark,head));}
 const expressionState={laugh:0,closure:0,pull:0};
 function syncExpression(){const isLaugh=expressionState.laugh>.025,isPull=expressionState.pull>.025&&!isLaugh;neutralMouth.visible=!isLaugh&&!isPull;laughMouth.visible=isLaugh;pullMouth.visible=isPull;const closed=expressionState.closure>.8;eyes.forEach(o=>o.visible=!closed);closedEyes.forEach(o=>o.visible=closed);pullBrows.forEach(o=>o.visible=isPull);}
 syncExpression();
 group.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;for(let i=0;i<n.count;i++){if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<.1){const v=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize();if(v.lengthSq()<.1)v.set(0,0,1);n.setXYZ(i,v.x,v.y,v.z);}}});
 group.userData={description:'Dudu, a broad-headed chubby tan bear with golden cheeks, a round bare belly and short paws. Independent bear proportions and topology.',morphTargets:names};
 return {group,head,face,softMeshes,eyes,faceZ,names,expressionState,syncExpression};
}
class DuduLaughAnimator{constructor(model){this.model=model;this.amount=0;}apply(amount,closure=amount){this.amount=T.MathUtils.clamp(amount,0,1);this.model.expressionState.laugh=this.amount;this.model.expressionState.closure=T.MathUtils.clamp(closure,0,1);this.model.syncExpression();}reset(){this.apply(0,0);for(const eye of this.model.eyes)eye.scale.y=1;}}
class DuduPullAnimator{constructor(model){this.model=model;this.amount=0;}apply(amount){this.amount=T.MathUtils.clamp(amount,0,1);this.model.expressionState.pull=this.amount;this.model.syncExpression();}reset(){this.apply(0);}}
root.MiniDudu={createCharacter,faceZ};root.DuduLaughAnimator=DuduLaughAnimator;root.DuduPullAnimator=DuduPullAnimator;
})(globalThis);
