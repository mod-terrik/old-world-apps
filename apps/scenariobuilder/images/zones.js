function mkZone(c){
    const z=document.createElement('div');z.className=`deployment-zone ${c}`;
    z.innerHTML=`<div class="zone-label">24.0" × 12.0"</div>${mkRH()}`;
    Object.assign(z.style,{width:toPx(24)+'px',height:toPx(12)+'px',left:(W-toPx(24))/2+'px',top:(H-toPx(12))/2+'px'});
    tb.appendChild(z);mkDrag(z);z.querySelectorAll('.resize-handle').forEach(h=>h.onmousedown=e=>rsz(e,z,false))
}
function mkSZone(){
    const d=toPx(3),z=document.createElement('div');z.className='special-zone';
    z.innerHTML=`<div class="zone-label">3.0"</div>${mkRH()}`;
    Object.assign(z.style,{width:d+'px',height:d+'px',left:(W-d)/2+'px',top:(H-d)/2+'px'});
    tb.appendChild(z);mkDrag(z);z.querySelectorAll('.resize-handle').forEach(h=>h.onmousedown=e=>rsz(e,z,true))
}
function updZL(z){
    const l=z.querySelector('.zone-label');if(!l)return;
    const w=+z.style.width.slice(0,-2),h=+z.style.height.slice(0,-2);
    l.textContent=z.classList.contains('special-zone')?`${toIn(w).toFixed(1)}"`:`${toIn(w).toFixed(1)}" × ${toIn(h).toFixed(1)}"`
}
function rsz(e,el,circ){
    e.preventDefault();e.stopPropagation();st.rsz=true;
    const p=e.target.dataset.pos,isTxt=el.classList.contains('text-box');
    const s={x:e.clientX,y:e.clientY,w:+el.style.width.slice(0,-2),h:+el.style.height.slice(0,-2),l:+el.style.left.slice(0,-2),t:+el.style.top.slice(0,-2)};
    const doRsz=e=>{
        if(!st.rsz)return;
        let[dx,dy]=[e.clientX-s.x,e.clientY-s.y],[nw,nh,nl,nt]=[s.w,s.h,s.l,s.t];
        if(circ){
            let d=0;
            if(p==='bottom-right')d=Math.max(dx,dy);
            else if(p==='top-left'){d=-Math.max(dx,dy);nl=s.l-d;nt=s.t-d}
            else if(p==='top-right'){d=Math.max(dx,-dy);nt=s.t-d}
            else if(p==='bottom-left'){d=Math.max(-dx,dy);nl=s.l-d}
            nw=nh=clamp(s.w+d,15,toPx(18));
            if(p.includes('left'))nl=s.l+s.w-nw;
            if(p.includes('top'))nt=s.t+s.h-nh
        }else{
            if(p.includes('right'))nw=s.w+dx;
            else if(p.includes('left')){nw=s.w-dx;nl=s.l+dx}
            if(p.includes('bottom'))nh=s.h+dy;
            else if(p.includes('top')){nh=s.h-dy;nt=s.t+dy}
            if(isTxt){nw=clamp(nw,50,W);nh=clamp(nh,20,H)}
            else{nw=clamp(nw,15,toPx(72));nh=clamp(nh,15,toPx(48))}
        }
        nl=clamp(nl,0,W-nw);nt=clamp(nt,0,H-nh);
        Object.assign(el.style,{width:nw+'px',height:nh+'px',left:nl+'px',top:nt+'px'});updZL(el)
    };
    const endRsz=()=>{st.rsz=false;document.removeEventListener('mousemove',doRsz);document.removeEventListener('mouseup',endRsz)};
    document.addEventListener('mousemove',doRsz);document.addEventListener('mouseup',endRsz)
}
function mkDrag(el){
    const isTxt=el.classList.contains('text-box');
    el.onmousedown=e=>{
        if(st.mMode||st.tMode||e.target.classList.contains('resize-handle'))return;
        if(isTxt){e.stopPropagation();desel();el.classList.add('selected');st.sel=el;if(e.target.tagName==='TEXTAREA')return}
        if(!isTxt&&e.target.tagName==='TEXTAREA')return;
        e.preventDefault();if(!isTxt)e.stopPropagation();
        if(!isTxt){desel();el.classList.add('selected');st.sel=el}
        st.drag=true;
        const curL=parseFloat(el.style.left)||0,curT=parseFloat(el.style.top)||0;
        const mp=getPos(e,tb);const ox=curL-mp.x,oy=curT-mp.y;
        const doDrag=e=>{if(!st.drag)return;const p=getPos(e,tb);setPos(el,p.x+ox,p.y+oy,el.offsetWidth,el.offsetHeight)};
        const endDrag=()=>{st.drag=false;document.removeEventListener('mousemove',doDrag);document.removeEventListener('mouseup',endDrag)};
        document.addEventListener('mousemove',doDrag);document.addEventListener('mouseup',endDrag)
    };
    if(!isTxt)el.onclick=e=>{if(st.mMode||st.tMode||e.target.tagName==='TEXTAREA')return;e.stopPropagation();desel();el.classList.add('selected');st.sel=el}
}
$$('.zone-tool:not([id^=diag])').forEach(t=>t.onclick=()=>t.dataset.color==='yellow'?mkSZone():mkZone(t.dataset.color));
