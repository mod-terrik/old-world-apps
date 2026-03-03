tTool.onclick=()=>toggle(tTool,mTool,'tMode');
function mkTxt(x,y){
    const txt=document.createElement('div');txt.className='text-box';
    txt.innerHTML=`<textarea placeholder="Type here..."></textarea>${mkRH()}`;
    Object.assign(txt.style,{width:'200px',height:'100px',left:clamp(x-100,0,W-200)+'px',top:clamp(y-50,0,H-100)+'px'});
    tb.appendChild(txt);mkDrag(txt);txt.querySelectorAll('.resize-handle').forEach(h=>h.onmousedown=e=>rsz(e,txt,false));
    desel();txt.classList.add('selected');st.sel=txt;setTimeout(()=>txt.querySelector('textarea').focus(),10)
}
mTool.onclick=()=>toggle(mTool,tTool,'mMode');