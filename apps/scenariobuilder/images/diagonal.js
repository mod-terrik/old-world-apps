// ===================================
// Diagonal zones functionality
// ===================================

// ── Diagonal zones ────────────────────────────────────────────────
// diagZones array is declared in utils.js

function side(px,py,x1,y1,x2,y2){return(x2-x1)*(py-y1)-(y2-y1)*(px-x1)}

function sutherlandHodgman(poly,x1,y1,x2,y2,keepAbove){
    const out=[];
    for(let i=0;i<poly.length;i++){
        const cur=poly[i],nxt=poly[(i+1)%poly.length];
        const sc=side(cur[0],cur[1],x1,y1,x2,y2);
        const sn=side(nxt[0],nxt[1],x1,y1,x2,y2);
        const curIn=keepAbove?sc>=0:sc<=0;
        const nxtIn=keepAbove?sn>=0:sn<=0;
        if(curIn)out.push(cur);
        if(curIn!==nxtIn){const t=sc/(sc-sn);out.push([cur[0]+(nxt[0]-cur[0])*t,cur[1]+(nxt[1]-cur[1])*t])}
    }
    return out;
}

function drawPoly(ctx,pts,fill,borderColor,selected){
    if(!pts||pts.length<2)return;
    ctx.save();
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();
    if(selected){ctx.strokeStyle=borderColor;ctx.lineWidth=2;ctx.setLineDash([]);ctx.stroke()}
    ctx.restore();
}

function redrawDiag(){
    zCtx.clearRect(0,0,W,H);
    const rect=[[0,0],[W,0],[W,H],[0,H]];
    diagZones.forEach(d=>{
        const{x1,y1,x2,y2,color,selected}=d;
        const fillColor=color==='red'?'rgba(255,0,0,0.18)':'rgba(0,0,255,0.18)';
        const strokeColor=color==='red'?'#f00':'#00f';
        // Only color the triangle on the "above" side for red, "below" side for blue
        const pts=sutherlandHodgman(rect,x1,y1,x2,y2,color==='red');
        drawPoly(zCtx,pts,fillColor,strokeColor,selected);
        // Dashed dividing line
        zCtx.save();
        zCtx.setLineDash([12,8]);
        zCtx.strokeStyle=selected?'#FFD700':'rgba(180,180,180,0.9)';
        zCtx.lineWidth=selected?3:2;
        zCtx.beginPath();zCtx.moveTo(x1,y1);zCtx.lineTo(x2,y2);zCtx.stroke();
        zCtx.restore();
    });
}

function ptLineDist(px,py,x1,y1,x2,y2){
    const dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;
    if(len2===0)return dist(px,py,x1,y1);
    const t=clamp(((px-x1)*dx+(py-y1)*dy)/len2,0,1);
    return dist(px,py,x1+t*dx,y1+t*dy);
}

function mkDiagHandles(d){
    [1,2].forEach(n=>{
        const h=document.createElement('div');
        h.className='diag-handle';h.style.display='block';
        h.style.left=d['x'+n]+'px';h.style.top=d['y'+n]+'px';
        h.style.borderColor=d.color==='red'?'#f00':'#00f';
        tb.appendChild(h);d['h'+n]=h;
        h.onmousedown=e=>{
            e.preventDefault();e.stopPropagation();
            desel();d.selected=true;st.sel={type:'diagonal',data:d};
            d.h1.style.borderColor='#FFD700';d.h2.style.borderColor='#FFD700';
            redrawDiag();
            const drag=ev=>{
                const p=getPos(ev,tb);
                d['x'+n]=clamp(p.x,0,W);d['y'+n]=clamp(p.y,0,H);
                h.style.left=d['x'+n]+'px';h.style.top=d['y'+n]+'px';
                redrawDiag();
            };
            const end=()=>{document.removeEventListener('mousemove',drag);document.removeEventListener('mouseup',end)};
            document.addEventListener('mousemove',drag);document.addEventListener('mouseup',end);
        };
    });
}

function mkDiagZone(color){
    // Default: top-left to bottom-right. Red = top triangle, Blue = bottom triangle.
    const d={x1:0,y1:0,x2:W,y2:H,color,selected:false};
    diagZones.push(d);mkDiagHandles(d);redrawDiag();
}

$('#diagRedTool').onclick=()=>mkDiagZone('red');
$('#diagBlueTool').onclick=()=>mkDiagZone('blue');

// Click canvas to select/deselect diagonal zones
zCanvas.style.pointerEvents='auto';
zCanvas.onmousedown=e=>{
    if(st.mMode||st.tMode)return;
    const p=getPos(e,tb);
    let hit=null;
    diagZones.forEach(d=>{if(ptLineDist(p.x,p.y,d.x1,d.y1,d.x2,d.y2)<10)hit=d});
    if(hit){
        e.stopPropagation();desel();
        hit.selected=true;st.sel={type:'diagonal',data:hit};
        hit.h1.style.borderColor='#FFD700';hit.h2.style.borderColor='#FFD700';
        redrawDiag();
    } else {desel()}
};

tb.onclick=e=>{if(st.mMode||st.tMode||e.target!==tb)return;desel()};
document.onkeydown=e=>{
    if((e.key==='Delete'||e.key==='Backspace')&&st.sel){
        e.preventDefault();
        if(st.sel.type==='measurement'){st.sel.svg.remove()}
        else if(st.sel.type==='diagonal'){
            const d=st.sel.data;
            d.h1.remove();d.h2.remove();
            diagZones.splice(diagZones.indexOf(d),1);
            redrawDiag();
        }
        else{st.sel.remove()}
        st.sel=null
    }
};
</script>

<div class="zones-container">
<div class="zone-item"><div class="zone-tool red" data-color="red">🔴</div><div class="terrain-label">Red Zone</div></div>
<div class="zone-item"><div class="zone-tool blue" data-color="blue">🔵</div><div class="terrain-label">Blue Zone</div></div>
<div class="zone-item"><div class="zone-tool yellow" data-color="yellow">🟡</div><div class="terrain-label">Special Zone</div></div>
<div class="zone-item"><div class="zone-tool red-diag" id="diagRed" data-color="red-diag">↗️🔴</div><div class="terrain-label">Red Diagonal</div></div>
<div class="zone-item"><div class="zone-tool blue-diag" id="diagBlue" data-color="blue-diag">↗️🔵</div><div class="terrain-label">Blue Diagonal</div></div>
</div>
<div class="tabletop-container">
<div class="tabletop" id="tabletop">
  <canvas class="zone-canvas" id="zoneCanvas" width="1080" height="720"></canvas>
</div>
</div>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tabletop Terrain Simulator</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:#2c2c2c;padding:20px;display:flex;flex-direction:column;align-items:center;gap:20px;min-height:100vh}
        .page-container{display:flex;flex-direction:column;align-items:center;gap:20px;width:100%;max-width:1800px}
        .main-section{display:grid;grid-template-columns:180px 180px 1fr 180px 180px;gap:20px;width:100%;align-items:start}
        .legend{background:#3a3a3a;border:2px solid #555;border-radius:8px;padding:15px;height:fit-content;min-width:180px}
        .legend h3{color:#fff;margin-bottom:15px;font-size:16px;text-align:center}
        .zones-container{display:flex;flex-direction:column;gap:0;align-items:center}
        .zone-item{display:flex;flex-direction:column;align-items:center}
        .tabletop-wrapper{display:flex;flex-direction:column;align-items:center;gap:20px}
        .terrain-icon,.measure-tool,.zone-tool,.text-tool,.export-tool{width:80px;height:80px;margin:10px auto;cursor:pointer;border:2px solid #666;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:36px;transition:transform .2s,border-color .2s;background:#4a4a4a}
        .terrain-icon{overflow:hidden}
        .terrain-icon img{width:100%;height:100%;object-fit:cover}
        .terrain-icon:hover,.measure-tool:hover,.zone-tool:hover,.text-tool:hover,.export-tool:hover{transform:scale(1.1);border-color:#888}
        .measure-tool.active,.text-tool.active{border-color:#FFD700;border-width:3px;background:#5a5a2a}
        .export-tool{background:linear-gradient(135deg,#2c5f2d 0%,#4a9d4c 100%)}
        .zone-tool.red{background:linear-gradient(135deg,#600 0%,#a00 100%)}
        .zone-tool.blue{background:linear-gradient(135deg,#006 0%,#00a 100%)}
        .zone-tool.yellow{background:linear-gradient(135deg,#880 0%,#cc0 100%)}
        .terrain-label{text-align:center;color:#ccc;font-size:12px;margin-top:5px;margin-bottom:15px}
        .tabletop-container{width:1088px;height:728px;background:#8B4513;box-shadow:0 4px 20px rgba(0,0,0,.5);padding:4px;position:relative}
        .tabletop{width:1080px;height:720px;background:#fff;position:relative;overflow:hidden;cursor:crosshair}
        .placed-terrain,.deployment-zone,.special-zone,.text-box{position:absolute;cursor:move;user-select:none;transition:opacity .2s}
        .placed-terrain img{width:100%;height:100%;pointer-events:none}
        .placed-terrain.selected{opacity:.8;outline:3px dashed #000;outline-offset:4px}
        .deployment-zone{border:3px solid}
        .deployment-zone.red{background:rgba(255,0,0,.15);border-color:#f00}
        .deployment-zone.blue{background:rgba(0,0,255,.15);border-color:#00f}
        .special-zone{background:rgba(255,255,0,.15);border:3px solid #ff0;border-radius:50%}
        .text-box{background:transparent;border:none;min-width:100px;min-height:50px;padding:2px}
        .text-box.selected{border:2px solid #000}
        .text-box textarea{width:100%;height:100%;border:none;background:transparent;resize:none;font-family:Calibri,sans-serif;font-weight:600;font-size:18px;color:#000;outline:none;overflow:hidden;cursor:text;padding:0}
        .zone-label{position:absolute;top:5px;left:5px;font-size:12px;font-weight:bold;color:#fff;text-shadow:1px 1px 2px rgba(0,0,0,.8);pointer-events:none}
        .special-zone .zone-label{top:50%;left:50%;transform:translate(-50%,-50%)}
        .resize-handle{position:absolute;width:12px;height:12px;background:#fff;border:2px solid #000;border-radius:50%;z-index:10;display:none}
        .deployment-zone.selected .resize-handle,.special-zone.selected .resize-handle,.text-box.selected .resize-handle{display:block}
        .resize-handle.top-left{top:-6px;left:-6px;cursor:nwse-resize}
        .resize-handle.top-right{top:-6px;right:-6px;cursor:nesw-resize}
        .resize-handle.bottom-left{bottom:-6px;left:-6px;cursor:nesw-resize}
        .resize-handle.bottom-right{bottom:-6px;right:-6px;cursor:nwse-resize}
        .measure-line{position:absolute;pointer-events:none;z-index:1000}
        .measure-line line{stroke:#000;stroke-width:2}
        .measure-line.selected line{stroke:#f00;stroke-width:3}
        .measure-line text{fill:#000;font-size:14px;font-weight:bold;font-family:Arial,sans-serif;pointer-events:all;cursor:move}
        .measure-line.selected text{fill:#f00}
        .measure-endpoint{pointer-events:all;cursor:pointer;fill:#000;stroke:#fff;stroke-width:2;display:none}
        .measure-line.selected .measure-endpoint{display:block;fill:#f00;r:7}
        .instructions{color:#ccc;font-size:12px;padding:10px;background:#3a3a3a;border-radius:5px;border:1px solid #555}
        .scale-info{color:#aaa;font-size:11px;margin-top:15px;padding:8px;background:#333;border-radius:5px;text-align:center}

        .zone-canvas{position:absolute;top:0;left:0;width:1080px;height:720px;pointer-events:none;z-index:1}
        .diag-handle{position:absolute;width:16px;height:16px;background:#fff;border:3px solid #333;border-radius:50%;cursor:grab;z-index:20;display:none;transform:translate(-50%,-50%)}
        .diag-handle:active{cursor:grabbing}
        .zone-tool.red-diag{background:linear-gradient(135deg,#600 0%,#a00 100%);font-size:22px}
        .zone-tool.blue-diag{background:linear-gradient(135deg,#006 0%,#00a 100%);font-size:22px}
        @media(max-width:1900px){.page-container{transform:scale(.9);transform-origin:top center}}
        @media(max-width:1700px){.page-container{transform:scale(.8);transform-origin:top center}}
        @media(max-width:1500px){.page-container{transform:scale(.7);transform-origin:top center}}
        @media(max-width:1300px){.page-container{transform:scale(.6);transform-origin:top center}}
        @media(max-width:1150px){.page-container{transform:scale(.5);transform-origin:top center}}
        @media(max-width:950px){.page-container{transform:scale(.4);transform-origin:top center}}
        @media(max-width:768px){.page-container{transform:scale(.35);transform-origin:top center}}
    </style>
</head>
<body>
<div class="page-container">
<div class="main-section">
<div class="legend">
<h3>Zones</h3>
<div class="zones-container">
<div class="zone-item"><div class="zone-tool red" data-color="red">🔴</div><div class="terrain-label">Red Zone</div></div>
<div class="zone-item"><div class="zone-tool blue" data-color="blue">🔵</div><div class="terrain-label">Blue Zone</div></div>
<div class="zone-item"><div class="zone-tool yellow" data-color="yellow">🟡</div><div class="terrain-label">Special Zone</div></div>

<div class="zone-item"><div class="zone-tool red-diag" id="diagRedTool" data-color="red-diag">↗️🔴</div><div class="terrain-label">Red Diagonal</div></div>
<div class="zone-item"><div class="zone-tool blue-diag" id="diagBlueTool" data-color="blue-diag">↗️🔵</div><div class="terrain-label">Blue Diagonal</div></div>
</div>
</div>
<div class="legend">
<h3>Terrain Features</h3>
<div class="terrain-icon" data-terrain="hill" data-width="120" data-height="90"><img src="../images/ttb/hill.png" alt="Hill"></div>
<div class="terrain-label">Hill (8"×6")</div>
<div class="terrain-icon" data-terrain="forest" data-width="150" data-height="105"><img src="../images/ttb/forest.png" alt="Forest"></div>
<div class="terrain-label">Forest (10"×7")</div>
<div class="terrain-icon" data-terrain="building" data-width="90" data-height="75"><img src="../images/ttb/building.png" alt="Building"></div>
<div class="terrain-label">Building (6"×5")</div>
<div class="terrain-icon" data-terrain="field" data-width="105" data-height="105"><img src="../images/ttb/field.png" alt="Field"></div>
<div class="terrain-label">Field (7"×7")</div>
<div class="scale-info">Table: 72" × 48"<br>Scale: 15px = 1"</div>
</div>
<div class="tabletop-wrapper">
<div class="tabletop-container">
<div class="tabletop" id="tabletop"><canvas class="zone-canvas" id="zoneCanvas" width="1080" height="720"></canvas></div>
</div>
</div>
<div class="legend">
<h3>Tools</h3>
<div class="measure-tool" id="measureTool">📏</div>
<div class="terrain-label">Measure Tool</div>
<div class="text-tool" id="textTool">📝</div>
<div class="terrain-label">Text Tool</div>
<div class="export-tool" id="exportTool">💾</div>
<div class="terrain-label">Export Image</div>
</div>
<div class="legend">
<h3>Instructions</h3>
<div class="instructions">
<strong>Instructions:</strong><br>
• Click icon to place terrain<br>
• Drag terrain to move<br>
• Click terrain to select<br>
• Press Delete to remove<br><br>
<strong>Measure Tool:</strong><br>
• Click to activate<br>
• Drag at least 1" to create<br>
• Drag text to reposition<br>
• Drag endpoints to resize<br>
• Click measure to select<br>
• Delete to remove<br><br>
<strong>Text Tool:</strong><br>
• Click to activate<br>
• Click table to place<br>
• Type to add text<br>
• Drag to move<br>
• Drag corners to resize<br><br>
<strong>Export Image:</strong><br>
• Click to export table<br>
• Saves as 2160×1440 PNG<br>
• All elements included<br><br>
<strong>Deployment Zones:</strong><br>
• Click zone color to place<br>
• Drag zone to move<br>
• Drag corners to resize<br><br>
<strong>Diagonal Zones:</strong><br>
• Click Red/Blue Diagonal to place<br>
• Drag white handles to reposition<br>
• Click dashed line to select<br>
• Delete to remove<br><br>
<strong>Special Zone:</strong><br>
• Yellow circle (max 18")<br>
• Drag corners to resize
</div>
</div>
</div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js">
<script>
// COMPLETE FIXED JAVASCRIPT HERE - all diagonal features + original functionality
const $=document.querySelector.bind(document),$$=document.querySelectorAll.bind(document);
const tb=$('#tabletop'),mTool=$('#measureTool'),tTool=$('#textTool'),eTool=$('#exportTool');
const zCanvas=$('#zoneCanvas'),zCtx=zCanvas.getContext('2d');
const PPI=15,W=1080,H=720,MIN=PPI;
const st={sel:null,mMode:false,tMode:false,mCtr:0,drag:false,rsz:false};
const RH=['top-left','top-right','bottom-left','bottom-right'];
const clamp=(v,min,max)=>Math.max(min,Math.min(v,max));
const toIn=px=>px/PPI,toPx=i=>i*PPI,dist=(x1,y1,x2,y2)=>Math.sqrt((x2-x1)**2+(y2-y1)**2);
const desel=()=>{
    $$('.placed-terrain,.deployment-zone,.special-zone,.measure-line,.text-box').forEach(e=>e.classList.remove('selected'));
    diagZones.forEach(d=>{d.selected=false;const dc=d.color==='red'?'#f00':'#00f';if(d.h1)d.h1.style.borderColor=dc;if(d.h2)d.h2.style.borderColor=dc;if(d.hm)d.hm.style.borderColor=dc;if(d.label)d.label.style.color='#fff'});
    st.sel=null;redrawDiag()
};
const getPos=(e,el)=>{const r=el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
const setPos=(el,x,y,w,h)=>{el.style.left=clamp(x,0,W-w)+'px';el.style.top=clamp(y,0,H-h)+'px'};
const mkRH=()=>RH.map(p=>`<div class="resize-handle ${p}" data-pos="${p}"></div>`).join('');
const toggle=(t,o,p)=>{st[p]=!st[p];st[p==='mMode'?'tMode':'mMode']=false;t.classList.toggle('active');o.classList.remove('active');if(st[p])desel()};

// Diagonal zones - complete implementation
// diagZones array is declared in utils.js
function side(px,py,x1,y1,x2,y2){return(x2-x1)*(py-y1)-(y2-y1)*(px-x1)}
function sutherlandHodgman(poly,x1,y1,x2,y2,keepAbove){
    const out=[];
    for(let i=0;i<poly.length;i++){
        const cur=poly[i],nxt=poly[(i+1)%poly.length];
        const sc=side(cur[0],cur[1],x1,y1,x2,y2);
        const sn=side(nxt[0],nxt[1],x1,y1,x2,y2);
        const curIn=keepAbove?sc>=0:sc<=0;
        const nxtIn=keepAbove?sn>=0:sn<=0;
        if(curIn)out.push(cur);
        if(curIn!==nxtIn){const t=sc/(sc-sn);out.push([cur[0]+(nxt[0]-cur[0])*t,cur[1]+(nxt[1]-cur[1])*t])}
    }
    return out;
}
function drawPoly(ctx,pts,fill,borderColor,selected){
    if(!pts||pts.length<2)return;
    ctx.save();
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);
    ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();
    if(selected){ctx.strokeStyle=borderColor;ctx.lineWidth=2;ctx.setLineDash([]);ctx.stroke()}
    ctx.restore();
}
function shiftedLine(d){
    const dx=d.x2-d.x1,dy=d.y2-d.y1,len=Math.sqrt(dx*dx+dy*dy)||1;
    const nx=-dy/len,ny=dx/len;
    const off=d.offset||0;
    return{x1:d.x1+nx*off,y1:d.y1+ny*off,x2:d.x2+nx*off,y2=d.y2+ny*off,nx,ny};
}
function midHandlePos(d){
    const sl=shiftedLine(d);
    return{x:clamp((sl.x1+sl.x2)/2,20,W-20),y:clamp((sl.y1+sl.y2)/2,20,H-20)};
}
function diagEdgeInfo(d){
    const sl=shiftedLine(d);
    const A=sl.y2-sl.y1,B=sl.x1-sl.x2,C=sl.x2*sl.y1-sl.x1*sl.y2;
    const den=Math.sqrt(A*A+B*B);
    const dists=[Math.abs((A*0+B*0+C)/den),Math.abs((A*H+B*0+C)/den),Math.abs((A*0+B*W+C)/den),Math.abs((A*0+B*H+C)/den)];
    const min=Math.min(...dists);
    const inches=toIn(min).toFixed(1);
    return{inches,min,mid:midHandlePos(d)};
}
function redrawDiag(){
    zCtx.clearRect(0,0,W,H);
    const rect=[[0,0],[W,0],[W,H],[0,H]];
    diagZones.forEach(d=>{
        const{color,selected}=d;
        const sl=shiftedLine(d);
        const fillColor=color==='red'?'rgba(255,0,0,0.18)':'rgba(0,0,255,0.18)';
        const strokeColor=color==='red'?'#f00':'#00f';
        const pts=sutherlandHodgman(rect,sl.x1,sl.y1,sl.x2,sl.y2,color==='red');
        drawPoly(zCtx,pts,fillColor,strokeColor,selected);
        zCtx.save();
        zCtx.setLineDash([12,8]);
        zCtx.strokeStyle=selected?'#FFD700':'rgba(180,180,180,0.9)';
        zCtx.lineWidth=selected?3:2;
        zCtx.beginPath();zCtx.moveTo(sl.x1,sl.y1);zCtx.lineTo(sl.x2,sl.y2);zCtx.stroke();
        zCtx.restore();
        if(d.h1)d.h1.style.left=sl.x1+'px';d.h1.style.top=sl.y1+'px';
        if(d.h2)d.h2.style.left=sl.x2+'px';d.h2.style.top=sl.y2+'px';
        if(d.hm){const mp=midHandlePos(d);d.hm.style.left=mp.x+'px';d.hm.style.top=mp.y+'px'}
        const info=diagEdgeInfo(d);
        if(!d.label){const s=document.createElement('div');s.className='diag-label';tb.appendChild(s);d.label=s;}
        d.label.textContent=info.inches+'"';
        d.label.style.left=(info.mid.x+10)+'px';
        d.label.style.top=(info.mid.y-10)+'px';
    });
}
function ptLineDist(px,py,x1,y1,x2,y2){
    const dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;
    if(len2===0)return dist(px,py,x1,y1);
    const t=clamp(((px-x1)*dx+(py-y1)*dy)/len2,0,1);
    return dist(px,py,x1+t*dx,y1+t*dy);
}
function selectDiag(d){
    desel();d.selected=true;st.sel={type:'diagonal',data:d};
    const gold='#FFD700';
    if(d.h1)d.h1.style.borderColor=gold;
    if(d.h2)d.h2.style.borderColor=gold;
    if(d.hm)d.hm.style.borderColor=gold;
    redrawDiag();
}
function mkDiagHandles(d){
    const zc=d.color==='red'?'#f00':'#00f';
    [1,2].forEach(n=>{
        const h=document.createElement('div');
        h.className='diag-handle';h.style.display='block';
        const sl=shiftedLine(d);
        h.style.left=sl['x'+n]+'px';h.style.top=sl['y'+n]+'px';
        h.style.borderColor=zc;
        tb.appendChild(h);d['h'+n]=h;
        h.onmousedown=e=>{
            e.preventDefault();e.stopPropagation();
            selectDiag(d);
            const drag=ev=>{
                const p=getPos(ev,tb);
                const sl2=shiftedLine(d);
                d['x'+n]=p.x-sl2.nx*(d.offset||0);
                d['y'+n]=p.y-sl2.ny*(d.offset||0);
                redrawDiag();
            };
            const end=()=>{document.removeEventListener('mousemove',drag);document.removeEventListener('mouseup',end)};
            document.addEventListener('mousemove',drag);document.addEventListener('mouseup',end);
        };
    });
    const hm=document.createElement('div');
    hm.className='diag-handle larger';hm.style.display='block';
    hm.style.borderColor=zc;
    hm.title='Drag to expand/shrink zone';
    const mp=midHandlePos(d);hm.style.left=mp.x+'px';hm.style.top=mp.y+'px';
    tb.appendChild(hm);d.hm=hm;
    hm.onmousedown=e=>{
        e.preventDefault();e.stopPropagation();
        selectDiag(d);
        const startP=getPos(e,tb);
        const startOff=d.offset||0;
        const sl=shiftedLine(d);
        const drag=ev=>{
            const p=getPos(ev,tb);
            const delta=(p.x-startP.x)*sl.nx+(p.y-startP.y)*sl.ny;
            d.offset=startOff+delta;
            redrawDiag();
        };
        const end=()=>{document.removeEventListener('mousemove',drag);document.removeEventListener('mouseup',end)};
        document.addEventListener('mousemove',drag);document.addEventListener('mouseup',end);
    };
}
function mkDiagZone(color){
    const cx=W/2,cy=H/2;
    let d;
    if(color==='red'){
        d={x1:cx-toPx(1),y1:cy+toPx(1),x2:cx-toPx(25),y2:cy+toPx(25),color,offset:0,selected:false};
    } else {
        d={x1:cx+toPx(1),y1:cy-toPx(1),x2:cx+toPx(25),y2:cy-toPx(25),color,offset:0,selected:false};
    }
    diagZones.push(d);mkDiagHandles(d);redrawDiag();
}
$('#diagRedTool').onclick=()=>mkDiagZone('red');
$('#diagBlueTool').onclick=()=>mkDiagZone('blue');
zCanvas.style.pointerEvents='auto';
zCanvas.onmousedown=e=>{
    if(st.mMode||st.tMode)return;
    const p=getPos(e,tb);
    let hit=null;
    diagZones.forEach(d=>{if(ptLineDist(p.x,p.y,d.x1,d.y1,d.x2,d.y2)<12)hit=d});
    if(hit){e.stopPropagation();selectDiag(hit)} else {desel()}
};
