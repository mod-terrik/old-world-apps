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
    diagZones.forEach(d=>{d.selected=false;if(d.h1)d.h1.style.borderColor='#333';if(d.h2)d.h2.style.borderColor='#333'});
    st.sel=null;redrawDiag()
};
const getPos=(e,el)=>{const r=el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
const setPos=(el,x,y,w,h)=>{el.style.left=clamp(x,0,W-w)+'px';el.style.top=clamp(y,0,H-h)+'px'};
const mkRH=()=>RH.map(p=>`<div class="resize-handle ${p}" data-pos="${p}"></div>`).join('');
const toggle=(t,o,p)=>{st[p]=!st[p];st[p==='mMode'?'tMode':'mMode']=false;t.classList.toggle('active');o.classList.remove('active');if(st[p])desel()};

// ── Diagonal zones array (used by desel) ──
const diagZones=[];