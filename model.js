(function(root){
'use strict';const T=root.THREE;
const profile=[[-1.30,.025,.04],[-1.23,.37,.38],[-1.10,.63,.57],[-.86,.85,.72],[-.55,1.02,.82],[-.20,1.10,.85],[.15,1.085,.83],[.48,1.045,.81],[.85,1.01,.79],[1.16,.91,.72],[1.40,.70,.54],[1.57,.37,.30],[1.63,.025,.025]];
const G=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
function shape(y){let k=0;while(k<profile.length-2&&y>profile[k+1][0])k++;let a=profile[k],b=profile[k+1],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1),out=[];for(let c=1;c<3;c++){let prev=profile[Math.max(0,k-1)],next=profile[Math.min(profile.length-1,k+2)],m0=(b[c]-prev[c])/(b[0]-prev[0])*(b[0]-a[0]),m1=(next[c]-a[c])/(next[0]-a[0])*(b[0]-a[0]);out.push(Math.max(.025,(2*t**3-3*t*t+1)*a[c]+(t**3-2*t*t+t)*m0+(-2*t**3+3*t*t)*b[c]+(t**3-t*t)*m1));}return out;}
function faceZ(x,y){let [w,d]=shape(y),z=d*Math.sqrt(Math.max(.001,1-(x/w)**2));return z+.10*G(x,y,0,.27,.155,.48)+.28*G(x,y,0,-.07,.225,.19)+.085*G(x,y,-.20,-.15,.12,.10)+.085*G(x,y,.20,-.15,.12,.10)-.043*G(x,y,-.46,.31,.32,.22)-.043*G(x,y,.46,.31,.32,.22)+.115*G(x,y,-.67,-.24,.33,.35)+.115*G(x,y,.67,-.24,.33,.35)+.055*G(x,y,0,-.56,.45,.20)+.04*G(x,y,0,-1.02,.43,.24);}
function createCharacter(){
 const group=new T.Group();group.name='Mini Rheza — reference cartoon v4';const head=new T.Group();head.name='Head';head.position.y=.64;group.add(head);const softMeshes=[];
 function mat(name,color,roughness=.65){let m=new T.MeshStandardMaterial({color,roughness,metalness:0});m.name=name;return m;}
 const skin=mat('Warm tan skin','#c48960',.67),skinDark=mat('Warm eyelid shadow','#aa6e50',.74),earMat=mat('Ear bowl','#985d43',.8),browMat=mat('Dark soft eyebrows','#30261f',.87),white=mat('Warm eye whites','#f7eee0',.65),irisMat=mat('Brown iris','#6a432b',.70),irisRim=mat('Iris rim','#35291f',.70),pupilMat=mat('Pupils','#151714',.65),glint=mat('Eye highlights','#ffffff',.12),upperLip=mat('Upper lip','#955a48',.76),lowerLip=mat('Lower lip','#b5755c',.6),mouthMat=mat('Mouth crease','#5e3a30',.85),nostrilMat=mat('Nostrils','#62412e',.9),shirtMat=mat('Plain white cotton shirt','#f4f4ed',.9),seamMat=mat('Black collar and EXO print','#121212',.88);
 function mesh(name,geometry,material,parent=head,soft=false){let m=new T.Mesh(geometry,material);m.name=name;m.castShadow=true;m.receiveShadow=false;parent.add(m);if(soft)softMeshes.push(m);return m;}
 function ell(name,material,p,s,parent=head,soft=false){let m=mesh(name,new T.SphereGeometry(1,40,28),material,parent,soft);m.position.set(...p);m.scale.set(...s);return m;}
 function curve(name,points,r,material,parent=head,soft=false){let m=mesh(name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),36,r,8,false),material,parent,soft);return m;}
 const positions=[],colors=[],indices=[],rings=112,sides=192,baseColor=new T.Color('#c48960'),cheekColor=new T.Color('#cd805f'),beardColor=new T.Color('#76533d');
 for(let j=0;j<=rings;j++){let y=-1.30+j/rings*2.93,[w,d]=shape(y);for(let i=0;i<=sides;i++){let a=(i/sides-.5)*Math.PI*2,c=Math.cos(a),x=w*Math.sin(a),z=d*c;if(c>0)z+=(faceZ(x,y)-d*Math.sqrt(Math.max(.001,1-(x/w)**2)))*Math.min(1,c*3);positions.push(x,y,z);let color=baseColor.clone();if(c>0){let blush=.28*(G(x,y,-.73,-.24,.28,.26)+G(x,y,.73,-.24,.28,.26))+.10*G(x,y,0,-.10,.20,.18);color.lerp(cheekColor,blush);let stubble=.09*G(x,y,0,-1.13,.48,.13)+.14*G(Math.abs(x),y,.19,-.41,.16,.045);color.lerp(beardColor,stubble);}colors.push(color.r,color.g,color.b);}}
 for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){let a=j*(sides+1)+i,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
 let geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();const faceMat=skin.clone();faceMat.name='Sculpted skin with subtle cheek color';faceMat.color.set(0xffffff);faceMat.vertexColors=true;const face=mesh('Soft face',geometry,faceMat,head,true);
 const names=['pressLeft','pressRight','noseBoop','stretchLeft','stretchRight','liftLeft','liftRight'];geometry.morphTargetsRelative=true;geometry.morphAttributes.position=[];
 for(let k=0;k<names.length;k++){let a=new Float32Array(positions.length),side=k===0||k===3||k===5?-1:1,anchor=new T.Vector3(side*.68,-.28,faceZ(side*.68,-.28));if(k===2)anchor.set(0,-.08,faceZ(0,-.08));let radius=k===2?.30:.47;for(let i=0;i<positions.length;i+=3){let dx=positions[i]-anchor.x,dy=positions[i+1]-anchor.y,dz=positions[i+2]-anchor.z,w=Math.exp(-(dx*dx+dy*dy+dz*dz)/(radius*radius)*2.5);if(k<3)a[i+2]=-(k===2?.24:.30)*w;else if(k<5){a[i]=side*.7*w;a[i+2]=.12*w;}else a[i+1]=.55*w;}let attr=new T.Float32BufferAttribute(a,3);attr.name=names[k];geometry.morphAttributes.position.push(attr);}
 face.updateMorphTargets();
 // Almond-shaped eye surfaces meet the skin at their rim, without floating eyeballs.
 const eyes=[],pupils=[];
 for(let s of [-1,1]){let cx=s*.46,cy=.32,eye=new T.Group();eye.name=s<0?'Left eye':'Right eye';eye.position.y=cy;head.add(eye);eyes.push(eye);let v=[],idx=[],nx=48,ny=20,w=.285;
  function outline(u,top){let arc=Math.pow(Math.max(0,1-u*u),.52);let upper=.265*arc-.045*Math.pow(Math.max(0,1-u*u),2);return (top?upper:-.205*arc)+s*u*.008;}
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){let u=-1+i/nx*2,t=j/ny,x=cx+u*w,y=cy+outline(u,false)*(1-t)+outline(u,true)*t,z=faceZ(x,y)+.012+.095*Math.sin(Math.PI*t)*Math.sqrt(Math.max(0,1-u*u));v.push(x,y-cy,z);}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,b=a+nx+1;idx.push(a,a+1,b,b,a+1,b+1);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();mesh('Almond sclera',g,white,eye);
  // All iris layers conform to the same convex eye surface, avoiding floating discs.
  function eyeZ(x,y){let u=(x-cx)/w,lo=outline(u,false),hi=outline(u,true),t=T.MathUtils.clamp((y-lo)/(hi-lo||1),0,1);return faceZ(x,cy+y)+.012+.095*Math.sin(Math.PI*t)*Math.sqrt(Math.max(0,1-u*u));}
  function eyePatch(name,material,px,py,rx,ry,offset){let points=[],faces=[],nr=18,ns=64;for(let j=0;j<=nr;j++)for(let i=0;i<=ns;i++){let angle=i/ns*Math.PI*2,r=j/nr,x=px+Math.cos(angle)*rx*r,y=py+Math.sin(angle)*ry*r,u=(x-cx)/w;y=T.MathUtils.clamp(y,outline(u,false)+.004,outline(u,true)-.004);points.push(x,y,eyeZ(x,y)+offset);}for(let j=0;j<nr;j++)for(let i=0;i<ns;i++){let a=j*(ns+1)+i,b=a+ns+1;faces.push(a,b,a+1,b,b+1,a+1);}let geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.setIndex(faces);geometry.computeVertexNormals();let patch=mesh(name,geometry,material,eye);patch.castShadow=false;return patch;}
  eyePatch('Iris dark rim',irisRim,cx,.018,.190,.217,.008);
  eyePatch('Warm brown iris',irisMat,cx,.018,.177,.204,.014);
  let pupil=eyePatch('Pupil',pupilMat,cx,.030,.096,.116,.020);pupils.push(pupil);
  eyePatch('Large eye sparkle',glint,cx-.040,.103,.022,.024,.027);
  eyePatch('Small eye sparkle',glint,cx+.048,-.033,.007,.008,.027);
  let top=[],bottom=[],crease=[];for(let i=0;i<=18;i++){let u=-1+i/18*2,x=cx+u*w,yt=cy+outline(u,true),yb=cy+outline(u,false);top.push([x,yt-cy,faceZ(x,yt)+.024]);bottom.push([x,yb-cy,faceZ(x,yb)+.021]);let yc=yt+.065*Math.sqrt(Math.max(0,1-u*u));crease.push([x,yc-cy,faceZ(x,yc)+.009]);}
  curve('Upper lid',top,.027,skin,eye);curve('Lower lid',bottom,.019,skin,eye);curve('Upper lash line',top.map(p=>[p[0],p[1]-.01,p[2]+.015]),.009,browMat,eye);curve('Soft lid crease',crease,.0065,skinDark,eye);
  // Reduce the eye and lid geometry around its own center; retain blink scaling.
  for(const part of eye.children){const a=part.geometry.attributes.position;for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),xx=cx+(x-cx)*.8,yy=.03+(y-.03)*.8;a.setXYZ(i,xx,yy,a.getZ(i)+faceZ(xx,cy+yy)-faceZ(x,cy+y));}part.geometry.computeVertexNormals();}
  // Tapered thick brows, following the curvature of the forehead.
  let path=[];for(let i=0;i<=12;i++){let t=i/12,x=s*(.18+.63*t),y=.69+.10*Math.sin(t*Math.PI)-.07*t;path.push(new T.Vector3(x,y,faceZ(x,y)+.035));}let curveB=new T.CatmullRomCurve3(path),bg=new T.TubeGeometry(curveB,48,.065,10,false),bp=bg.attributes.position;for(let i=0;i<bp.count;i++){let row=Math.floor(i/11),t=row/48,c=curveB.getPointAt(t),f=.16+.84*Math.pow(Math.sin(Math.PI*(.14+.85*t)),.7);bp.setXYZ(i,c.x+(bp.getX(i)-c.x)*f,c.y+(bp.getY(i)-c.y)*f,c.z+(bp.getZ(i)-c.z)*.52*f);}for(let i=0;i<bp.count;i++){let x=bp.getX(i),y=bp.getY(i),xx=s*.495+(x-s*.495)*.8,yy=.74+(y-.74)*.8-.048;bp.setXYZ(i,xx,yy,faceZ(xx,yy)+(bp.getZ(i)-faceZ(x,y))*.8);}bg.computeVertexNormals();mesh('Tapered eyebrow',bg,browMat);
  const nxp=s*.157,nyp=-.205;let nostril=ell('Nostril',nostrilMat,[nxp,nyp,faceZ(nxp,nyp)+.008],[.043,.014,.008],head,true);nostril.rotation.z=s*.14;
 }
 ell('Rounded nose tip',skin,[0,-.075,1.125],[.168,.116,.108],head,true);
 for(let s of [-1,1])ell('Nose wing',skin,[s*.166,-.145,1.08],[.105,.078,.095],head,true);

 // Sculpted lips with a subtle smile and cupid's bow, not stacked tubes.
 const lipWidth=.405,mouthY=-.61;
 function lineY(u){return mouthY+.050*Math.pow(Math.abs(u),1.7);}
 for(let upper of [true,false]){let v=[],idx=[],nx=72,ny=10;for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){let u=-1+2*i/nx,t=j/ny,x=u*lipWidth,edge=Math.pow(Math.max(0,1-u*u),.8),height=upper?(.063+.020*Math.exp(-(((Math.abs(u)-.28)/.18)**2))):.095;let y=lineY(u)+(upper?1:-1)*height*edge*t,z=faceZ(x,y)+.012+.047*edge*Math.sin(Math.PI*(.2+.8*t));v.push(x,y,z);}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,b=a+nx+1;if(upper)idx.push(a,a+1,b,b,a+1,b+1);else idx.push(a,b,a+1,b,b+1,a+1);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();mesh(upper?'Cupid upper lip':'Soft lower lip',g,upper?upperLip:lowerLip,head,true);}
 let mouthLine=[];for(let i=0;i<=24;i++){let u=-1+2*i/24,x=u*lipWidth,y=lineY(u);mouthLine.push([x,y,faceZ(x,y)+.035]);}curve('Smile line',mouthLine,.009,mouthMat,head,true);
 // Natural-sized ears with a recessed bowl and a continuous outer helix.
 for(let s of [-1,1]){let ear=new T.Group();ear.name='Ear';ear.position.set(s*1.035,-.03,-.03);ear.rotation.y=s*.10;ear.rotation.z=-s*.08;head.add(ear);
  ell('Outer ear',skin,[s*.03,0,0],[.165,.285,.12],ear);ell('Inner ear bowl',earMat,[s*.055,.015,.098],[.087,.17,.016],ear);
  curve('Ear helix',[[s*.015,-.24,.07],[s*.12,-.15,.11],[s*.155,.025,.10],[s*.12,.20,.08],[s*.025,.24,.08],[-s*.04,.13,.10]],.029,skin,ear);
  curve('Ear inner fold',[[s*.015,-.13,.12],[s*.075,-.025,.124],[s*.055,.10,.12],[s*.01,.14,.115]],.023,skin,ear);ell('Ear tragus',skin,[-s*.015,-.06,.13],[.045,.073,.026],ear);ell('Ear lobe',skin,[s*.025,-.22,.04],[.085,.085,.08],ear);
 }
 // Sculpted wavy hairstyle from the supplied cartoon reference.
 const hairMat=mat('Dark chestnut hair','#241c20',.73),strandMat=mat('Chestnut strand sheen','#3c2d30',.70),strandDark=mat('Hair groove','#1c171b',.85);
 const hp=[],hi=[],hr=40,hs=128;
 for(let j=0;j<=hr;j++)for(let i=0;i<=hs;i++){let a=(i/hs-.5)*Math.PI*2,f=(Math.cos(a)+1)/2,bottom=-.27+1.47*Math.pow(f,1.5),p=j/hr*Math.acos((bottom-.35)/1.60),wave=.014*Math.sin(a*13+p*9)+.008*Math.sin(a*23-p*17);hp.push((1.125+wave)*Math.sin(p)*Math.sin(a),.35+(1.60+wave)*Math.cos(p),(1.0+wave)*Math.sin(p)*Math.cos(a)+.035);}
 for(let j=0;j<hr;j++)for(let i=0;i<hs;i++){let a=j*(hs+1)+i,b=a+hs+1;hi.push(a,b,a+1,a+1,b,b+1);}let hg=new T.BufferGeometry();hg.setAttribute('position',new T.Float32BufferAttribute(hp,3));hg.setIndex(hi);hg.computeVertexNormals();mesh('Continuous wavy hair base',hg,hairMat);
 function lock(name,points,radius,depth=.62){let path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=56,radial=12,frames=path.computeFrenetFrames(segments,false),pv=[],ix=[];
  function sample(i,theta,lift=0){let t=i/segments,c=path.getPointAt(t),taper=.12+.88*Math.pow(Math.sin(Math.PI*(.09+.88*t)),.52),r=radius*taper+lift,n=frames.normals[i],b=frames.binormals[i],d=n.clone().multiplyScalar(Math.cos(theta)*r).addScaledVector(b,Math.sin(theta)*r);d.z*=depth;return c.add(d);}
  for(let i=0;i<=segments;i++)for(let k=0;k<=radial;k++){let p=sample(i,k/radial*Math.PI*2);pv.push(p.x,p.y,p.z);}for(let i=0;i<segments;i++)for(let k=0;k<radial;k++){let a=i*(radial+1)+k,b=a+radial+1;ix.push(a,a+1,b,b,a+1,b+1);}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pv,3));g.setIndex(ix);g.computeVertexNormals();mesh(name,g,hairMat);
  for(let k=0;k<13;k++){let pts=[];for(let i=2;i<segments-1;i+=2)pts.push(sample(i,(k+.35)/13*Math.PI*2,.003).toArray());curve('Fine wavy hair strand',pts,k%4===0?.003:.002,k%4===0?strandMat:strandDark);}
 }
 lock('Left sweeping forelock',[[.30,1.80,.70],[-.15,2.03,.90],[-.65,1.90,1.0],[-.82,1.50,1.05],[-1.00,1.19,.95],[-1.22,1.25,.80]],.20);
 lock('Right sweeping forelock',[[.42,1.80,.70],[.42,1.58,.94],[.52,1.18,1.05],[.82,.98,1.02],[1.10,1.05,.86],[1.28,1.29,.62]],.19);
 lock('Left lower wave',[[.10,1.68,.8],[-.24,1.72,1.0],[-.45,1.35,1.08],[-.62,1.08,1.02],[-1.0,.98,.83],[-1.2,1.10,.64]],.16);
 lock('Right lower wave',[[.72,1.78,.58],[.99,1.65,.80],[1.18,1.29,.83],[1.32,1.15,.63],[1.35,1.38,.36]],.16);
 lock('Central quiff',[[-.90,1.7,.45],[-.72,2.04,.62],[-.24,2.15,.7],[.19,1.98,.8],[.40,1.83,.70]],.18);
 lock('Crown wave left',[[-1.02,1.38,.26],[-.94,1.89,.32],[-.53,2.11,.27],[-.12,2.09,.22],[.09,1.92,.28]],.21);
 lock('Crown wave right',[[.27,1.95,.27],[.66,2.05,.27],[1.02,1.79,.28],[1.18,1.46,.25],[1.04,1.23,.22]],.21);
 for(let s of [-1,1]){
  lock('Side wavy hair',[[s*.84,1.65,-.20],[s*1.17,1.48,-.12],[s*1.24,1.02,-.05],[s*1.11,.73,.04],[s*1.03,.48,.05]],.15);
  lock('Back crown lock',[[s*.16,1.96,-.30],[s*.54,1.91,-.55],[s*.87,1.60,-.64],[s*1.03,1.13,-.55]],.19);
  lock('Back hair wave',[[s*.94,1.42,-.43],[s*1.09,.98,-.57],[s*.89,.58,-.76],[s*.58,.46,-.84]],.16);
  curve('Tapered sideburn',[[s*1.04,.73,.18],[s*1.07,.49,.12],[s*1.055,.26,.045]],.032,hairMat);
 }
 const fineFacialHair=mat('Fine moustache and chin stubble','#79573d',.95);
 for(let s of [-1,1])for(let i=0;i<27;i++){let x=s*(.064+i*.0104),y=-.426-.035*Math.pow(i/26,1.5),pts=[];for(let k=0;k<3;k++){let xx=x+s*k*.006,yy=y-k*.018;pts.push([xx,yy,faceZ(xx,yy)+.007]);}curve('Soft moustache strand',pts,.0016,fineFacialHair,head,true);}
 for(let i=0;i<30;i++){let x=(i-14.5)*.018,y=-1.17+.035*Math.abs(x)/.27;curve('Chin stubble',[[x,y,faceZ(x,y)+.006],[x+.002,y-.023,faceZ(x+.002,y-.023)+.007]],.0016,fineFacialHair,head,true);}

 let neck=mesh('Neck',new T.CylinderGeometry(.43,.52,.85,64,12),skin,group);neck.position.set(0,-.93,-.08);neck.scale.z=.85;
 let bv=[],bi=[],br=48,bs=96;for(let j=0;j<=br;j++){let u=j/br,y=-2.32+u*1.17,w=1.38-.10*u-.73*Math.pow(u,8),d=.57-.14*Math.pow(u,5);for(let i=0;i<=bs;i++){let a=i/bs*Math.PI*2;bv.push(w*Math.sin(a),y,d*Math.cos(a)-.08);}}for(let j=0;j<br;j++)for(let i=0;i<bs;i++){let a=j*(bs+1)+i,b=a+bs+1;bi.push(a,a+1,b,b,a+1,b+1);}let torsoG=new T.BufferGeometry();torsoG.setAttribute('position',new T.Float32BufferAttribute(bv,3));torsoG.setIndex(bi);torsoG.computeVertexNormals();mesh('Plain white EXO shirt',torsoG,shirtMat,group);
 let collar=mesh('Black shirt collar',new T.TorusGeometry(.48,.045,12,96),seamMat,group);collar.rotation.x=Math.PI/2;collar.position.set(0,-1.15,-.08);collar.scale.y=.86;
 function chestZ(x,y){let u=T.MathUtils.clamp((y+2.32)/1.17,0,1),w=1.38-.10*u-.73*u**8,d=.57-.14*u**5;return d*Math.sqrt(Math.max(.01,1-(x/w)**2))-.08+.009;}
 // Classic EXO hexagon mark: four filled facets with an X-shaped gap and E notch.
 // Reference: https://commons.wikimedia.org/wiki/File:Logo_de_EXO.png (S.M. Entertainment).
 // Subdivide before projecting so the flat print stays flush against the rounded chest.
 function logoFacet(name,points){
  const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x*.38,-1.81+y*.38):shape.moveTo(x*.38,-1.81+y*.38));shape.closePath();
  const raw=new T.ShapeGeometry(shape),rp=raw.attributes.position,ri=raw.index.array,vertices=[];
  function divide(a,b,c,n){if(!n){for(const v of [a,b,c])vertices.push(v[0],v[1],chestZ(v[0],v[1]));return;}const ab=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca=[(c[0]+a[0])/2,(c[1]+a[1])/2];divide(a,ab,ca,n-1);divide(ab,b,bc,n-1);divide(ca,bc,c,n-1);divide(ab,bc,ca,n-1);}
  for(let i=0;i<ri.length;i+=3)divide([rp.getX(ri[i]),rp.getY(ri[i])],[rp.getX(ri[i+1]),rp.getY(ri[i+1])],[rp.getX(ri[i+2]),rp.getY(ri[i+2])],4);
  raw.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const logo=mesh(name,g,seamMat,group);logo.castShadow=false;return logo;
 }
 const leftFacet=[[-.55,.866],[-.06,0],[-.55,-.866],[-1,-.055],[-.42,-.055]];
 for(let i=1;i<=12;i++){const angle=-Math.PI/2+i/12*Math.PI;leftFacet.push([-.42+.055*Math.cos(angle),.055*Math.sin(angle)]);}
 leftFacet.push([-1,.055]);
 logoFacet('EXO emblem left E facet',leftFacet);
 logoFacet('EXO emblem right facet',[[.55,.866],[1,0],[.55,-.866],[.06,0]]);
 logoFacet('EXO emblem upper facet',[[-.425,.866],[.425,.866],[0,.115]]);
 logoFacet('EXO emblem lower facet',[[0,-.115],[.425,-.866],[-.425,-.866]]);

 // Merge fine strands by material to keep the interactive model lightweight.
 for(let [label,material,isSoft] of [['Fine wavy hair strand',strandMat,false],['Fine wavy hair strand',strandDark,false],['Facial stubble',fineFacialHair,true]]){
  let parts=head.children.filter(o=>o.isMesh&&o.material===material&&(label==='Facial stubble'?['Soft moustache strand','Chin stubble'].includes(o.name):o.name===label));if(!parts.length)continue;let positions=[],normals=[],indices=[],count=0;
  for(let part of parts){let g=part.geometry;positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);for(let v of g.index.array)indices.push(v+count);count+=g.attributes.position.count;head.remove(part);let at=softMeshes.indexOf(part);if(at>=0)softMeshes.splice(at,1);g.dispose();}
  let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setIndex(indices);mesh(label,g,material,head,isSoft);
 }

 group.traverse(o=>{if(!o.isMesh)return;let p=o.geometry.attributes.position,n=o.geometry.attributes.normal;for(let i=0;i<n.count;i++)if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<1e-6){let v=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize();if(v.lengthSq()<.1)v.set(0,1,0);n.setXYZ(i,v.x,v.y,v.z);}});
 group.userData={description:'Wavy-haired cartoon portrait shaped from the supplied stylized reference. Procedural sculpt; no photographic face texture.',morphTargets:names};
 return {group,head,face,eyes,pupils,softMeshes,names,faceZ};
}
root.MiniRheza={createCharacter,faceZ};
})(globalThis);
