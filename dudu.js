(function(root){
'use strict';
const T=root.THREE;
// One profile carries the cheeks into the tummy without a neck or stacked rolls.
// Width turns inward beneath each cheek; front depth keeps a smooth, gentle taper.
const upperHeadY=y=>y>.20?.20+(y-.20)*1.15:y;
const headProfile=[[-2.39,.65,.32],[-2.30,.82,.46],[-2.10,.88,.54],[-1.72,.89,.60],[-1.32,.86,.65],[-1.08,.85,.70],[-.99,.96,.72],[-.91,1.25,.74],[-.79,1.47,.77],[-.60,1.58,.81],[-.39,1.60,.84],[-.16,1.55,.86],[.20,1.54,.85],[.55,1.46,.79],[.87,1.27,.69],[1.15,.94,.51],[1.36,.48,.26],[1.43,.025,.025]].map(([y,w,d])=>[upperHeadY(y),w,d]);
function profileAt(profile,y){let k=0;while(k<profile.length-2&&y>profile[k+1][0])k++;const a=profile[k],b=profile[k+1],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1),v=[];for(let c=1;c<=2;c++){const prev=profile[Math.max(0,k-1)],next=profile[Math.min(profile.length-1,k+2)],m0=(b[c]-prev[c])/(b[0]-prev[0])*(b[0]-a[0]),m1=(next[c]-a[c])/(next[0]-a[0])*(b[0]-a[0]);v.push(Math.max(.025,(2*t*t*t-3*t*t+1)*a[c]+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*b[c]+(t*t*t-t*t)*m1));}return v;}
function faceZ(x,y){const [w,d]=profileAt(headProfile,y);return d*Math.pow(Math.max(.001,1-Math.pow(Math.abs(x/w),3)),1/3);}
// Only the little limbs need a smooth union into the continuous core.
const smoothstep=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function smoothUnion(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
function roundedVolume(x,y,z,cx,cy,cz,rx,ry,rz,p=2){return (Math.pow(Math.pow(Math.abs((x-cx)/rx),p)+Math.pow(Math.abs((y-cy)/ry),p)+Math.pow(Math.abs((z-cz)/rz),p),1/p)-1)*Math.min(rx,ry,rz);}
function armDistance(x,y,z,side){
 const ax=side*.79,ay=-1.12,az=.015,bx=side*1.045,by=-1.50,bz=.035;
 const dx=bx-ax,dy=by-ay,dz=bz-az,t=T.MathUtils.clamp(((x-ax)*dx+(y-ay)*dy+(z-az)*dz)/(dx*dx+dy*dy+dz*dz),0,1);
 return Math.hypot(x-ax-t*dx,y-ay-t*dy,(z-az-t*dz)/1.25)-.205;
}
function bearDistance(x,y,z){
 const cy=T.MathUtils.clamp(y,headProfile[0][0],headProfile[headProfile.length-1][0]),[w,d]=profileAt(headProfile,cy);
 const horizontal=(Math.cbrt(Math.pow(Math.abs(x/w),3)+Math.pow(Math.abs(z/d),3))-1)*Math.min(w,d);
 const vertical=Math.max(headProfile[0][0]-y,y-headProfile[headProfile.length-1][0]);
 let distance=Math.max(horizontal,vertical);
 for(const side of [-1,1]){
  distance=smoothUnion(distance,armDistance(x,y,z,side),.13);
  const foot=roundedVolume(x,y,z,side*.555,-2.38,.005,.305,.29,.445,2.8);
  distance=smoothUnion(distance,foot,.115);
 }
 return distance;
}
function bodyFrontZ(x,y){let lo=0,hi=1.05;for(let i=0;i<24;i++){const mid=(lo+hi)*.5;if(bearDistance(x,y,mid)<0)lo=mid;else hi=mid;}return (lo+hi)*.5;}
function interactionRegion(p){
 if(p.z<.18)return null;
 if(p.y>-2.21&&p.y<-1.02&&Math.abs(p.x)<.79)return 'belly';
 if(Math.abs(p.x)<.24&&p.y>-.43&&p.y<.09)return 'nose';
 if(Math.abs(p.x)>.30&&Math.abs(p.x)<1.65&&p.y<.28&&p.y>-.90)return 'cheek';
 return null;
}
function deformationMask(p,part){
 // No influence may reach either arm or the leg/foot region, even on a two-finger pull.
 if(p.y<-1.02&&(Math.abs(p.x)>=.80||p.y<=-2.25))return 0;
 if(part==='belly')return smoothstep(-2.25,-2.08,p.y)*(1-smoothstep(-1.03,-.85,p.y))*(1-smoothstep(.60,.80,Math.abs(p.x)))*smoothstep(.08,.28,p.z);
 return smoothstep(-1.10,-.90,p.y);
}
function continuousBearGeometry(){
 const min=[-1.66,-2.75,-.97],max=[1.66,1.70,.97],step=.045;
 const nx=Math.ceil((max[0]-min[0])/step),ny=Math.ceil((max[1]-min[1])/step),nz=Math.ceil((max[2]-min[2])/step),sx=nx+1,sy=ny+1;
 const dx=(max[0]-min[0])/nx,dy=(max[1]-min[1])/ny,dz=(max[2]-min[2])/nz,total=sx*sy*(nz+1);
 const field=new Float32Array(total),positions=[],indices=[],edgeVertices=new Map();
 const gridPoint=id=>{const x=id%sx,y=Math.floor(id/sx)%sy,z=Math.floor(id/(sx*sy));return [min[0]+x*dx,min[1]+y*dy,min[2]+z*dz];};
 for(let z=0;z<=nz;z++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){
  const value=bearDistance(min[0]+x*dx,min[1]+y*dy,min[2]+z*dz);field[x+sx*(y+sy*z)]=Math.abs(value)<1e-8?1e-8:value;
 }
 function vertex(a,b){
  const low=Math.min(a,b),high=Math.max(a,b),key=low*total+high;if(edgeVertices.has(key))return edgeVertices.get(key);
  const pa=gridPoint(a),pb=gridPoint(b);let lo=0,hi=1,va=field[a],vb=field[b];
  // Refine on the original grid edge: a smooth surface without moving topology.
  for(let i=0;i<8;i++){const t=(lo+hi)*.5,v=bearDistance(pa[0]+(pb[0]-pa[0])*t,pa[1]+(pb[1]-pa[1])*t,pa[2]+(pb[2]-pa[2])*t);if((v<0)===(va<0)){lo=t;va=v;}else{hi=t;vb=v;}}
  const t=(lo*vb-hi*va)/(vb-va),id=positions.length/3;positions.push(pa[0]+(pb[0]-pa[0])*t,pa[1]+(pb[1]-pa[1])*t,pa[2]+(pb[2]-pa[2])*t);edgeVertices.set(key,id);return id;
 }
 function triangle(a,b,c,direction){
  const ai=a*3,bi=b*3,ci=c*3,ux=positions[bi]-positions[ai],uy=positions[bi+1]-positions[ai+1],uz=positions[bi+2]-positions[ai+2],vx=positions[ci]-positions[ai],vy=positions[ci+1]-positions[ai+1],vz=positions[ci+2]-positions[ai+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  if(nx*direction[0]+ny*direction[1]+nz*direction[2]<0)indices.push(a,c,b);else indices.push(a,b,c);
 }
 const tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const base=x+sx*(y+sy*z),cube=[base,base+1,base+sx+1,base+sx,base+sx*sy,base+sx*sy+1,base+sx*sy+sx+1,base+sx*sy+sx];
  let count=0;for(const id of cube)if(field[id]<0)count++;if(count===0||count===8)continue;
  for(const tetra of tetrahedra){const inside=[],outside=[];for(const corner of tetra){const id=cube[corner];(field[id]<0?inside:outside).push(id);}if(!inside.length||!outside.length)continue;
   const direction=[0,0,0];for(const id of outside){const p=gridPoint(id);for(let k=0;k<3;k++)direction[k]+=p[k]/outside.length;}for(const id of inside){const p=gridPoint(id);for(let k=0;k<3;k++)direction[k]-=p[k]/inside.length;}
   if(inside.length===1){const a=inside[0];triangle(vertex(a,outside[0]),vertex(a,outside[1]),vertex(a,outside[2]),direction);}
   else if(outside.length===1){const a=outside[0];triangle(vertex(a,inside[0]),vertex(a,inside[1]),vertex(a,inside[2]),direction);}
   else{const a=vertex(inside[0],outside[0]),b=vertex(inside[0],outside[1]),c=vertex(inside[1],outside[0]),d=vertex(inside[1],outside[1]);triangle(a,b,d,direction);triangle(a,d,c,direction);}
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 // The implicit surface gives consistent lighting even across skinny triangles.
 // Keep triangle normals separately so live pulls can transport this smooth shading.
 const normals=geometry.attributes.normal.array;geometry.userData.smoothDeformationReference=normals.slice();
 const epsilon=.001,normal=new T.Vector3();
 for(let i=0;i<positions.length;i+=3){const x=positions[i],y=positions[i+1],z=positions[i+2];normal.set(bearDistance(x+epsilon,y,z)-bearDistance(x-epsilon,y,z),bearDistance(x,y+epsilon,z)-bearDistance(x,y-epsilon,z),bearDistance(x,y,z+epsilon)-bearDistance(x,y,z-epsilon));if(normal.lengthSq()>1e-14)normal.normalize().toArray(normals,i);}
 geometry.computeBoundingSphere();return geometry;
}
function createCharacter(){
 const group=new T.Group();group.name='Dudu — chubby bear';const head=new T.Group();head.name='Dudu head';head.position.y=.35;group.add(head);const softMeshes=[],eyes=[];
 const mat=(name,color,roughness=.92)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness:0});m.name=name;return m;};
 const fur=mat('Dudu warm biscuit fur','#d9a083'),dark=mat('Dudu cocoa outlines','#482820'),inner=mat('Dudu inner ears','#754336'),cheek=mat('Dudu golden blush','#ffcb77'),pink=mat('Dudu pink tongue','#ef7d91'),mouthDark=mat('Dudu mouth interior','#4b2427');
 function mesh(name,g,m,parent=head,soft=false){const o=new T.Mesh(g,m);o.name=name;o.castShadow=true;o.receiveShadow=false;parent.add(o);if(soft)softMeshes.push(o);return o;}
 function ell(name,m,pos,scale,parent=head,soft=false){const o=mesh(name,new T.SphereGeometry(1,48,32),m,parent,soft);o.position.set(...pos);o.scale.set(...scale);return o;}
 function curve(name,points,r,m,parent=head,soft=false){const o=mesh(name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),40,r,8,false),m,parent,soft);o.castShadow=false;return o;}
 // Round ears sit behind the broad cheeks and domed forehead.
 for(const s of [-1,1]){const ear=ell('Dudu round ear',fur,[s*1.12,upperHeadY(1.13),-.05],[.34,.35,.22]);ear.rotation.z=-s*.24;const bowl=ell('Dudu inner ear',inner,[s*1.12,upperHeadY(1.155),.19],[.225,.225,.028]);bowl.rotation.z=-s*.24;bowl.castShadow=false;}
 const face=mesh('Dudu continuous head and body',continuousBearGeometry(),fur,head,true);
 const bellyAnchor=new T.Vector3(0,-1.67,bodyFrontZ(0,-1.67)),bellyRadius=.65;
 const names=['pressLeft','pressRight','noseBoop','stretchLeft','stretchRight','bellyPress','bellyStretch'];face.geometry.morphTargetsRelative=true;face.geometry.morphAttributes.position=[];
 const p=face.geometry.attributes.position;
 for(let k=0;k<names.length;k++){const a=new Float32Array(p.array.length),side=k===0||k===3?-1:1,isBelly=k>=5,cx=isBelly?bellyAnchor.x:k===2?0:side*1.02,cy=isBelly?bellyAnchor.y:k===2?-.20:-.50,cz=isBelly?bellyAnchor.z:faceZ(cx,cy),r=isBelly?bellyRadius:k===2?.28:.65,point=new T.Vector3();for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);const dx=point.x-cx,dy=point.y-cy,dz=point.z-cz,w=Math.exp(-(dx*dx+dy*dy+dz*dz)/(r*r)*2.3)*deformationMask(point,isBelly?'belly':'cheek');if(k<3||k===5)a[i*3+2]=-.28*w;else{a[i*3]=(isBelly?.65:side*.75)*w;a[i*3+2]=.1*w;}}const attr=new T.Float32BufferAttribute(a,3);attr.name=names[k];face.geometry.morphAttributes.position.push(attr);}face.updateMorphTargets();
 // Flush color patches follow the curved head instead of floating as separate balls.
 function patch(name,cx,cy,rx,ry,material,parent=head,soft=false,zOffset=.012){const v=[],ix=[],nr=18,ns=64;for(let j=0;j<=nr;j++)for(let i=0;i<=ns;i++){const r=j/nr,a=i/ns*Math.PI*2,x=cx+rx*r*Math.cos(a),y=cy+ry*r*Math.sin(a);v.push(x,y,faceZ(x,y)+zOffset);}for(let j=0;j<nr;j++)for(let i=0;i<ns;i++){let a=j*(ns+1)+i,b=a+ns+1;ix.push(a,b,a+1,b,b+1,a+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ix);g.computeVertexNormals();const o=mesh(name,g,material,parent,soft);o.castShadow=false;return o;}
 for(const s of [-1,1]){patch('Dudu golden cheek',s*1.04,-.48,.275,.285,cheek,head,true);const eye=new T.Group();eye.name=s<0?'Dudu left eye':'Dudu right eye';eye.position.set(s*.57,-.12,faceZ(s*.57,-.12)+.020);head.add(eye);eyes.push(eye);ell('Dudu dot eye',dark,[0,0,0],[.131,.140,.034],eye).castShadow=false;}
 // Tiny W smile and tongue are deliberately unlike the human character's lips.
 const neutralMouth=new T.Group();neutralMouth.name='Dudu neutral mouth';head.add(neutralMouth);
 patch('Dudu tongue outline',0,-.315,.125,.193,dark,neutralMouth,true,.019);
 patch('Dudu tongue',0,-.326,.087,.144,pink,neutralMouth,true,.027);
 const wSmile=[[-.15,-.135],[-.13,-.185],[-.078,-.205],[0,-.167],[.078,-.205],[.13,-.185],[.15,-.135]].map(([x,y])=>[x,y,faceZ(x,y)+.036]);curve('Dudu W smile',wSmile,.021,dark,neutralMouth,true);
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
 group.userData={description:'Dudu, a continuous tan bear silhouette with broad cheeks flowing into a short soft torso and integrated stubby arms and feet. Belly and cheeks deform; limbs stay fixed.',morphTargets:names};
 return {group,head,face,softMeshes,eyes,faceZ,names,expressionState,syncExpression,bellyAnchor,bellyRadius,interactionRegion,classifySurface:interactionRegion,deformationMask};
}
class DuduLaughAnimator{constructor(model){this.model=model;this.amount=0;}apply(amount,closure=amount){this.amount=T.MathUtils.clamp(amount,0,1);this.model.expressionState.laugh=this.amount;this.model.expressionState.closure=T.MathUtils.clamp(closure,0,1);this.model.syncExpression();}reset(){this.apply(0,0);for(const eye of this.model.eyes)eye.scale.y=1;}}
class DuduPullAnimator{constructor(model){this.model=model;this.amount=0;}apply(amount){this.amount=T.MathUtils.clamp(amount,0,1);this.model.expressionState.pull=this.amount;this.model.syncExpression();}reset(){this.apply(0);}}
root.MiniDudu={createCharacter,faceZ,interactionRegion,deformationMask};root.DuduLaughAnimator=DuduLaughAnimator;root.DuduPullAnimator=DuduPullAnimator;
})(globalThis);
