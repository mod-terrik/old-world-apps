$$('.terrain-icon').forEach(i=>i.onclick=()=>{
    st.mMode=st.tMode=false;mTool.classList.remove('active');tTool.classList.remove('active');
    mkTerrain(i.querySelector('img').src,+i.dataset.width,+i.dataset.height)
});
function mkTerrain(s,w,h){
    const el=document.createElement('div');el.className='placed-terrain';el.innerHTML=`<img src="${s}">`;
    Object.assign(el.style,{width:w+'px',height:h+'px',left:(W-w)/2+'px',top:(H-h)/2+'px'});
    tb.appendChild(el);mkDrag(el)
}
