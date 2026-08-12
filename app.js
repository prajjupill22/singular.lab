import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';

const $=s=>document.querySelector(s);
const stage=$('#stage'), video=$('#video'), fx=$('#fx'), start=$('#start'), prompt=$('#prompt'), message=$('#message');
const camStatus=$('#camStatus'), trackStatus=$('#trackStatus'), handsEl=$('#hands'), linkState=$('#linkState'), mode=$('#mode');
const energyEl=$('#energy'), energyBar=$('#energyBar'), energyText=$('#energyText'), hudStability=$('#hudStability'), stability=$('#stability');
const gestureEl=$('#gesture'), stageText=$('#stageText'), warning=$('#warning'), handState=$('#handState'), handIcon=$('#handIcon');
const confidenceEl=$('#confidence'), vectorEl=$('#vector'), coordsEl=$('#coords'), gravityEl=$('#gravity'), entropyEl=$('#entropy'), radiusEl=$('#radius'), fieldMeter=$('#fieldMeter'), chargeRate=$('#chargeRate'), fpsEl=$('#fps');

function clock(){ $('#clock').textContent=new Date().toLocaleTimeString('en-GB'); } setInterval(clock,500); clock();

let W=stage.clientWidth,H=stage.clientHeight;
const renderer=new THREE.WebGLRenderer({canvas:fx,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.setSize(W,H,false);
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x010203,.035);
const camera=new THREE.PerspectiveCamera(44,W/H,.1,100); camera.position.set(0,0,7.2);

const composer=new EffectComposer(renderer); composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(W,H),1.25,.7,.12); composer.addPass(bloom);

// ---------- black-hole architecture ----------
const root=new THREE.Group(); scene.add(root);
const core=new THREE.Mesh(new THREE.SphereGeometry(.48,64,64),new THREE.MeshBasicMaterial({color:0x000000}));
root.add(core);
const photon=new THREE.Mesh(new THREE.TorusGeometry(.59,.035,20,256),new THREE.MeshBasicMaterial({color:0xffd1d4,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
photon.rotation.x=Math.PI/2; root.add(photon);

function glowRing(radius,tube,color,opacity=1){
  const m=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,12,256),new THREE.MeshBasicMaterial({color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));
  m.rotation.x=Math.PI/2; root.add(m); return m;
}
const rings=[glowRing(.78,.018,0xff304d,.95),glowRing(1.05,.025,0xff5d6b,.62),glowRing(1.42,.012,0x75e8ff,.45),glowRing(1.82,.009,0xff304d,.25)];

const disk=new THREE.Mesh(new THREE.RingGeometry(.62,2.15,256,8),new THREE.MeshBasicMaterial({color:0xff263d,transparent:true,opacity:.13,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
disk.rotation.x=.22; root.add(disk);

// spiral filaments = actual 3D tubes, not flat points
function makeSpiral(turns,radial,offset,color){
  const pts=[]; const n=900;
  for(let i=0;i<n;i++){const t=i/(n-1)*Math.PI*2*turns; const r=.58+radial*i/(n-1); const z=(Math.sin(t*1.7+offset)*.035)*(1-i/(n-1)); pts.push(new THREE.Vector3(Math.cos(t)*r,Math.sin(t)*r*.23+z,Math.sin(t)*r));}
  const curve=new THREE.CatmullRomCurve3(pts); const g=new THREE.TubeGeometry(curve,700,.008,5,false);
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false});
  const mesh=new THREE.Mesh(g,mat); root.add(mesh); return mesh;
}
const filamentA=makeSpiral(7,1.65,0,0xff405a), filamentB=makeSpiral(6.2,1.5,2.4,0xff9aa5);

// 3D particulate matter: instanced low-poly grains + volumetric dust
const grainCount=2600, grainGeo=new THREE.IcosahedronGeometry(.018,1);
const grainMat=new THREE.MeshStandardMaterial({color:0xff5268,emissive:0x5e0b18,emissiveIntensity:2.8,roughness:.55,metalness:.15});
const grains=new THREE.InstancedMesh(grainGeo,grainMat,grainCount); grains.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(grains);
const gPos=[],gVel=[],gPhase=[];
const dummy=new THREE.Object3D();
for(let i=0;i<grainCount;i++){
  const a=Math.random()*Math.PI*2, r=.7+Math.pow(Math.random(),.52)*2.6, y=(Math.random()-.5)*(.12+.34*Math.random())*(1.1-r/4);
  gPos.push(new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));
  gVel.push(new THREE.Vector3(0,0,0)); gPhase.push(Math.random()*Math.PI*2);
  dummy.position.copy(gPos[i]); const s=.35+Math.random()*1.35; dummy.scale.setScalar(s); dummy.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6); dummy.updateMatrix(); grains.setMatrixAt(i,dummy.matrix);
}

// fine dust: supports depth with varying sizes; these are a secondary layer, while grains are real 3D geometry
const dustCount=15800,dustPos=new Float32Array(dustCount*3),dustSeed=new Float32Array(dustCount);
for(let i=0;i<dustCount;i++){const a=Math.random()*Math.PI*2,r=.55+Math.pow(Math.random(),.48)*3.5,j=i*3;dustPos[j]=Math.cos(a)*r;dustPos[j+1]=(Math.random()-.5)*(.15+.55*Math.random())*(1-r/5);dustPos[j+2]=Math.sin(a)*r;dustSeed[i]=Math.random();}
const dustGeo=new THREE.BufferGeometry(); dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
const dustMat=new THREE.PointsMaterial({color:0xff6a7a,size:.017,sizeAttenuation:true,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false});
const dust=new THREE.Points(dustGeo,dustMat); root.add(dust);

// blue lens/field particles moving on independent 3D shells
const shellCount=900,shellGeo=new THREE.SphereGeometry(.011,6,6),shellMat=new THREE.MeshBasicMaterial({color:0x78eaff,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false});
const shell=new THREE.InstancedMesh(shellGeo,shellMat,shellCount); shell.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(shell);
const shellData=Array.from({length:shellCount},()=>({a:Math.random()*6.28,b:Math.random()*3.14,r:2.1+Math.random()*2.1,s:Math.random()*.7+.4}));

// sparse background stars
const starsN=1000,stars=new Float32Array(starsN*3);
for(let i=0;i<starsN;i++){const r=8+Math.random()*16,a=Math.random()*6.28,b=Math.acos(2*Math.random()-1),j=i*3;stars[j]=r*Math.sin(b)*Math.cos(a);stars[j+1]=r*Math.cos(b);stars[j+2]=r*Math.sin(b)*Math.sin(a);}
const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));
scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x8aa8b0,size:.012,transparent:true,opacity:.5,depthWrite:false})));

let target=new THREE.Vector3(),field=new THREE.Vector3(),energy=0,over=0,active=false,gesture='NONE',lastFrame=performance.now(),fps=60;
let trackingReady=false;

function setStatus(el,text,ok){el.textContent=text;el.classList.toggle('ok',ok);el.classList.toggle('bad',!ok)}
function resize(){W=stage.clientWidth;H=stage.clientHeight;renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();composer.setSize(W,H);}
addEventListener('resize',resize);

function updateField(dt,t){
  const e=energy, grav=.55+e*2.6, spin=.0012+e*.006;
  field.lerp(target,.12);
  root.position.copy(field);
  const pulse=1+Math.sin(t*.004)*.018+e*.22;
  core.scale.setScalar(pulse);
  photon.scale.setScalar(1+e*.12);
  rings.forEach((r,i)=>{r.rotation.z+=spin*(i%2?-1:1);r.scale.setScalar(1+e*(.08+i*.06));});
  disk.rotation.z+=spin*.3; filamentA.rotation.z+=spin*.35; filamentB.rotation.z-=spin*.26;
  dust.rotation.z+=spin*.65;
  // physically-ish orbital motion for the 3D grains
  for(let i=0;i<grainCount;i++){
    const p=gPos[i],v=gVel[i],r=Math.hypot(p.x,p.z)+.001;
    const pull=(.00008+e*.00055)/(r*.28+1);
    v.x+=-p.x/r*pull; v.z+=-p.z/r*pull;
    const tangent=(.0012+e*.0022)/(Math.sqrt(r)+.2);
    v.x+=p.z/r*tangent; v.z-=p.x/r*tangent;
    v.multiplyScalar(.993);
    p.addScaledVector(v,dt*60);
    // prevent escape and re-seed into the accretion volume
    if(Math.hypot(p.x,p.z)>4.1){p.multiplyScalar(.72);p.y*=.6}
    const wobble=Math.sin(t*.0015+gPhase[i])*(.0007+e*.0018);
    p.y+=wobble;
    dummy.position.copy(p); dummy.rotation.x+=.01; dummy.rotation.y+=.014; dummy.scale.setScalar(.35+1.35*(.5+.5*Math.sin(gPhase[i])));
    dummy.updateMatrix(); grains.setMatrixAt(i,dummy.matrix);
  }
  grains.instanceMatrix.needsUpdate=true;
  // blue shell
  for(let i=0;i<shellCount;i++){const d=shellData[i];d.a+=dt*.0008*d.s*(1+e);const x=Math.cos(d.a)*Math.sin(d.b)*d.r,y=Math.cos(d.b)*d.r*.55,z=Math.sin(d.a)*Math.sin(d.b)*d.r;dummy.position.set(x,y,z);dummy.scale.setScalar(.5+.5*Math.sin(t*.002+i));dummy.updateMatrix();shell.setMatrixAt(i,dummy.matrix);}
  shell.instanceMatrix.needsUpdate=true;
  dust.rotation.y+=dt*.00015*(1+e*4);
}

function render(t){
  requestAnimationFrame(render); const now=performance.now(),dt=Math.min(.033,(now-lastFrame)/1000);lastFrame=now;
  fps=fps*.92+(1/dt)*.08; if(Math.random()<.08)fpsEl.textContent=Math.round(fps);
  active=active||energy>.005;
  [root,dust,grains,shell].forEach(o=>o.visible=active);
  if(active) updateField(dt*1000,t);
  composer.render();
}
render(0);

function setEnergy(v){energy=Math.max(0,Math.min(1,v));const pct=Math.round(energy*100);energyEl.textContent=pct+'%';energyText.textContent=pct+'%';energyBar.style.width=pct+'%';fieldMeter.style.width=pct+'%';const stab=Math.max(0,Math.round(100-energy*78));stability.textContent=stab+'%';hudStability.textContent=stab+'%';gravityEl.textContent=(.55+energy*2.6).toFixed(2)+'×';entropyEl.textContent=(energy*energy*1.7).toFixed(2);radiusEl.textContent=(1+energy*1.8).toFixed(2);chargeRate.textContent=(energy*3.5).toFixed(2);}
setEnergy(0);

async function enableCamera(){
  start.disabled=true;start.innerHTML='<span>◌</span> INITIALIZING…';message.textContent='Requesting camera permission…';
  try{
    if(!window.isSecureContext) throw new Error('SECURE_CONTEXT');
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('NO_CAMERA_API');
    const constraints={audio:false,video:{facingMode:{ideal:'user'},width:{ideal:1280,min:640},height:{ideal:720,min:480},frameRate:{ideal:30,max:60}}};
    const stream=await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject=stream; await new Promise(r=>video.onloadedmetadata=r); await video.play();
    setStatus(camStatus,'ACTIVE',true);linkState.textContent='LINKED';linkState.style.color='var(--green)';prompt.style.display='none';mode.textContent='CAMERA ONLINE';active=true;
    await initHandTracking();
  }catch(err){
    console.error(err);start.disabled=false;start.innerHTML='<span>●</span> ENABLE CAMERA + TRACKING';
    const text=err.message==='SECURE_CONTEXT'?'GitHub Pages is secure. If testing locally, use localhost (not file://).':err.name==='NotAllowedError'?'Camera permission was denied. Allow camera access for this site, then retry.':err.name==='NotFoundError'?'No camera device was found.':err.name==='NotReadableError'?'The camera is busy. Close other apps using it and retry.':err.message==='NO_CAMERA_API'?'This browser does not expose the camera API. Use a modern browser over HTTPS.':'Camera initialization failed: '+(err.message||err.name);
    message.textContent=text;setStatus(camStatus,'ERROR',false);
  }
}

async function initHandTracking(){
  // The Tasks-Vision tracker is preferred. If it cannot download/initialize
  // (common with CDN/CORS/WebGL issues on GitHub Pages), automatically fall
  // back to the proven MediaPipe Hands runtime.
  trackingReady=false;
  setStatus(trackStatus,'LOADING',false);
  $('#trackDot').style.color='var(--amber)';
  message.textContent='Loading vision engine…';

  const setTrackingError=(err)=>{
    console.error('Hand tracking error:',err);
    trackingReady=false;
    setStatus(trackStatus,'FAILED',false);
    $('#trackDot').style.color='var(--red)';
    mode.textContent='CAMERA ONLY';
    const detail = err?.message || String(err);
    message.textContent='Tracking failed: '+detail+' — retrying with compatibility mode…';
  };

  // Preferred: MediaPipe Tasks Vision.
  try{
    const {HandLandmarker,FilesetResolver}=await import(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm'
    );
    const vision=await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
    );
    const model='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

    let tracker;
    try{
      tracker=await HandLandmarker.createFromOptions(vision,{
        baseOptions:{modelAssetPath:model,delegate:'GPU'},
        runningMode:'VIDEO',numHands:2,
        minHandDetectionConfidence:.35,
        minHandPresenceConfidence:.35,
        minTrackingConfidence:.35
      });
    }catch(gpuErr){
      console.warn('GPU hand tracker unavailable; using CPU.',gpuErr);
      tracker=await HandLandmarker.createFromOptions(vision,{
        baseOptions:{modelAssetPath:model,delegate:'CPU'},
        runningMode:'VIDEO',numHands:2,
        minHandDetectionConfidence:.30,
        minHandPresenceConfidence:.30,
        minTrackingConfidence:.30
      });
    }

    trackingReady=true;
    setStatus(trackStatus,'ACTIVE',true);
    $('#trackDot').style.color='var(--green)';
    message.textContent='Vision link established. Show one hand to the camera.';
    mode.textContent='VISION ONLINE';

    let lastVideoTime=-1, busy=false;
    const loop=async()=>{
      if(!busy && video.readyState>=2 && video.videoWidth && video.currentTime!==lastVideoTime){
        busy=true;
        lastVideoTime=video.currentTime;
        try{
          const result=tracker.detectForVideo(video,Math.round(performance.now()));
          processHands(result?.landmarks||[],result?.handednesses||[]);
        }catch(e){ console.warn('Vision frame skipped:',e); }
        busy=false;
      }
      requestAnimationFrame(loop);
    };
    loop();
    return;
  }catch(tasksErr){
    setTrackingError(tasksErr);
    console.warn('Tasks Vision unavailable. Falling back to MediaPipe Hands.',tasksErr);
  }

  // Compatibility fallback: classic MediaPipe Hands. This avoids the
  // "TRACKING FAILED" dead-end when the Tasks runtime/model is blocked.
  try{
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469404/hands.js');
    if(typeof window.Hands!=='function') throw new Error('MediaPipe Hands runtime did not load');

    const hands=new window.Hands({
      locateFile:(file)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469404/${file}`
    });
    hands.setOptions({
      maxNumHands:2,
      modelComplexity:1,
      minDetectionConfidence:.35,
      minTrackingConfidence:.35
    });

    hands.onResults((results)=>{
      const landmarks=results?.multiHandLandmarks||[];
      processHands(landmarks,[]);
      if(landmarks.length){
        trackingReady=true;
        setStatus(trackStatus,'ACTIVE',true);
        $('#trackDot').style.color='var(--green)';
        mode.textContent='COMPATIBILITY VISION';
        message.textContent='Hand tracking active — compatibility vision mode.';
      }
    });

    trackingReady=true;
    setStatus(trackStatus,'ACTIVE',true);
    $('#trackDot').style.color='var(--green)';
    mode.textContent='COMPATIBILITY VISION';
    message.textContent='Compatibility vision ready. Show your hand to the camera.';

    let busy=false;
    const loop=async()=>{
      if(!busy && video.readyState>=2 && video.videoWidth){
        busy=true;
        try{ await hands.send({image:video}); }
        catch(e){ console.warn('Compatibility frame skipped:',e); }
        busy=false;
      }
      requestAnimationFrame(loop);
    };
    loop();
  }catch(fallbackErr){
    console.error('All hand tracking engines failed:',fallbackErr);
    setStatus(trackStatus,'FAILED',false);
    $('#trackDot').style.color='var(--red)';
    mode.textContent='CAMERA ONLY';
    message.textContent='Camera works, but the vision engine could not load. Check that GitHub Pages has internet access, then reload.';
  }
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src===src);
    if(existing){ existing.addEventListener('load',resolve,{once:true}); existing.addEventListener('error',reject,{once:true}); return; }
    const s=document.createElement('script');
    s.src=src; s.async=true;
    s.onload=resolve; s.onerror=()=>reject(new Error('Could not load vision compatibility runtime'));
    document.head.appendChild(s);
  });
}

function processHands(list,handed){
  handsEl.textContent=list.length; if(!list.length){handState.textContent='NO HAND DETECTED';handIcon.textContent='○';gestureEl.textContent='NO SIGNAL';confidenceEl.textContent='0%';setStatus($('#inputStatus'),'WAIT',false);return;}
  const h=list[0], dist=(a,b)=>Math.hypot(h[a].x-h[b].x,h[a].y-h[b].y), up=(tip,pip)=>h[tip].y<h[pip].y;
  const point=up(8,6)&&!up(12,10)&&!up(16,14)&&!up(20,18), pinch=dist(4,8)<.07, open=up(8,6)&&up(12,10)&&up(16,14)&&up(20,18), fist=!up(8,6)&&!up(12,10)&&!up(16,14)&&!up(20,18), two=list.length>=2;
  const x=(.5-h[8].x)*5.2, y=(.5-h[8].y)*3.2; target.set(x,y,0);
  const conf=handed?.[0]?.[0]?.score ?? .85;confidenceEl.textContent=Math.round(conf*100)+'%';
  vectorEl.textContent=`${x.toFixed(2)} ${y.toFixed(2)} 0.00`;coordsEl.textContent=`${x.toFixed(2)} / ${y.toFixed(2)} / 0.00`;
  active=true;setStatus($('#inputStatus'),'LIVE',true);
  if(point){gesture='POINT';gestureEl.textContent='POINT // SINGULARITY';stageText.textContent='CHARGING';handIcon.textContent='✦';handState.textContent='INDEX VECTOR LOCKED';setEnergy(energy+.0032);over=energy>.84?over+.0032:0;if(energy>.84)warning.style.display='block';if(over>.75){energy=.05;over=0;warning.style.display='none';stageText.textContent='FIELD RESET';}}
  else if(pinch){gesture='PINCH';gestureEl.textContent='PINCH // GRAVITY';stageText.textContent='GRAVITY WELL';handIcon.textContent='◉';handState.textContent='GRAVITY FOCUS';setEnergy(energy+.0015);}
  else if(open){gesture='PALM';gestureEl.textContent='PALM // PLASMA';stageText.textContent='PLASMA CORE';handIcon.textContent='✋';handState.textContent='FIELD EXPANSION';setEnergy(energy-.001);}
  else if(fist){gesture='FIST';gestureEl.textContent='FIST // COLLAPSE';stageText.textContent='COLLAPSE';handIcon.textContent='●';handState.textContent='COLLAPSE COMMAND';setEnergy(energy-.025);}
  else if(two){gesture='TWO HANDS';gestureEl.textContent='TWO HANDS // PORTAL';stageText.textContent='PORTAL FIELD';handIcon.textContent='◎';handState.textContent='DUAL VECTOR LOCK';setEnergy(energy+.001);}
  else{gesture='TRACKING';gestureEl.textContent='TRACKING';stageText.textContent='READY';handState.textContent='LANDMARKS LOCKED';}
}

start.addEventListener('click',enableCamera);
window.addEventListener('beforeunload',()=>{const s=video.srcObject;if(s)s.getTracks().forEach(t=>t.stop());});
