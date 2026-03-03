tb.onmousedown=e=>{
    if(e.target!==tb&&e.target!==zCanvas)return;
    if(st.tMode){e.preventDefault();const p=getPos(e,tb);mkTxt(p.x,p.y);return}
    if(!st.mMode)return;
    e.preventDefault();
    const p=getPos(e,tb),s={x:clamp(p.x,0,W),y:clamp(p.y,0,H)};
    const svg=mkSVG(s);tb.appendChild(svg);const ln=svg.querySelector('line');
    const mv=e=>{const p=getPos(e,tb);ln.setAttribute('x2',clamp(p.x,0,W));ln.setAttribute('y2',clamp(p.y,0,H))};
    const end=e=>{const p=getPos(e,tb),ep={x:clamp(p.x,0,W),y:clamp(p.y,0,H)};
        dist(s.x,s.y,ep.x,ep.y)<MIN?svg.remove():finM(svg,s,ep);
        document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',end)};
    document.addEventListener('mousemove',mv);document.addEventListener('mouseup',end)
};
function mkSVG(s){
    const id=st.mCtr,svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('measure-line');svg.setAttribute('data-measure-id','measure-'+id);
    Object.assign(svg.style,{position:'absolute',left:'0',top:'0',width:'100%',height:'100%',pointerEvents:'none'});
    svg.innerHTML=`<defs><marker id="arrowstart-${id}" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"><path d="M 6 0 L 0 3 L 6 6 z" fill="#000"/></marker><marker id="arrowend-${id}" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 z" fill="#000"/></marker></defs><line x1="${s.x}" y1="${s.y}" x2="${s.x}" y2="${s.y}" marker-start="url(#arrowstart-${id})" marker-end="url(#arrowend-${id})"/>`;
    return svg
}
function finM(svg,s,e){
    const id=st.mCtr++,d=dist(s.x,s.y,e.x,e.y),a=Math.atan2(e.y-s.y,e.x-s.x);
    const m={x:(s.x+e.x)/2,y:(s.y+e.y)/2},lp={x:m.x+25*Math.cos(a+Math.PI/2),y:m.y+25*Math.sin(a+Math.PI/2)};
    svg.measureData={x1:s.x,y1:s.y,x2:e.x,y2:e.y};
    const mkEP=(x,y,t)=>{const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.classList.add('measure-endpoint');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r','5');c.setAttribute('data-endpoint',t);c.onmousedown=ev=>rszM(ev,svg,t);return c};
    svg.appendChild(mkEP(s.x,s.y,'start'));svg.appendChild(mkEP(e.x,e.y,'end'));
    const txt=document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.textContent=toIn(d).toFixed(1)+'"';txt.setAttribute('x',lp.x);txt.setAttribute('y',lp.y);txt.setAttribute('text-anchor','middle');txt.setAttribute('dominant-baseline','middle');
    svg.appendChild(txt);
    svg.onclick=ev=>{if(st.mMode||st.tMode)return;ev.stopPropagation();desel();svg.classList.add('selected');st.sel={svg,type:'measurement'}};
    txt.onmousedown=ev=>mvM(ev,svg)
}
function mvM(e,svg){
    if(st.mMode||st.tMode)return;e.preventDefault();e.stopPropagation();desel();svg.classList.add('selected');st.sel={svg,type:'measurement'};
    const p=getPos(e,tb),d=svg.measureData,of={x1:d.x1-p.x,y1:d.y1-p.y,x2:d.x2-p.x,y2:d.y2-p.y};
    const drag=e=>{const p=getPos(e,tb);svg.measureData={x1:clamp(p.x+of.x1,0,W),y1:clamp(p.y+of.y1,0,H),x2:clamp(p.x+of.x2,0,W),y2:clamp(p.y+of.y2,0,H)};updM(svg)};
    const end=()=>{document.removeEventListener('mousemove',drag);document.removeEventListener('mouseup',end)};
    document.addEventListener('mousemove',drag);document.addEventListener('mouseup',end)
}
function rszM(e,svg,ep){
    if(st.mMode||st.tMode)return;e.preventDefault();e.stopPropagation();desel();svg.classList.add('selected');st.sel={svg,type:'measurement'};
    const drag=e=>{const p=getPos(e,tb),x=clamp(p.x,0,W),y=clamp(p.y,0,H),d=svg.measureData;
        const nd=ep==='start'?{x1:x,y1:y,x2:d.x2,y2:d.y2}:{x1:d.x1,y1:d.y1,x2:x,y2:y};
        if(dist(nd.x1,nd.y1,nd.x2,nd.y2)>=MIN){svg.measureData=nd;updM(svg)}};
    const end=()=>{document.removeEventListener('mousemove',drag);document.removeEventListener('mouseup',end)};
    document.addEventListener('mousemove',drag);document.addEventListener('mouseup',end)
}
function updM(svg){
    const d=svg.measureData,ln=svg.querySelector('line'),sc=svg.querySelector('[data-endpoint="start"]'),ec=svg.querySelector('[data-endpoint="end"]'),txt=svg.querySelector('text');
    ln.setAttribute('x1',d.x1);ln.setAttribute('y1',d.y1);ln.setAttribute('x2',d.x2);ln.setAttribute('y2',d.y2);
    sc.setAttribute('cx',d.x1);sc.setAttribute('cy',d.y1);ec.setAttribute('cx',d.x2);ec.setAttribute('cy',d.y2);
    const ds=dist(d.x1,d.y1,d.x2,d.y2),a=Math.atan2(d.y2-d.y1,d.x2-d.x1),m={x:(d.x1+d.x2)/2,y:(d.y1+d.y2)/2};
    const lp={x:m.x+25*Math.cos(a+Math.PI/2),y:m.y+25*Math.sin(a+Math.PI/2)};
    txt.setAttribute('x',lp.x);txt.setAttribute('y',lp.y);txt.textContent=toIn(ds).toFixed(1)+'"'
}
tb.onclick=e=>{if(st.mMode||st.tMode||e.target!==tb)return;desel()};
document.onkeydown=e=>{
    if((e.key==='Delete'||e.key==='Backspace')&&st.sel){
        e.preventDefault();
        if(st.sel.type==='measurement'){st.sel.svg.remove()}
        else if(st.sel.type==='diagonal'){
            const d=st.sel.data;
            if(d.h1)d.h1.remove();
            if(d.h2)d.h2.remove();
            if(d.hm)d.hm.remove();
            if(d.label)d.label.remove();
            diagZones.splice(diagZones.indexOf(d),1);
            redrawDiag();
        }
        else{st.sel.remove()}
        st.sel=null
    }
};