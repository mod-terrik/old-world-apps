// ── Export ────────────────────────────────────────────────────────
eTool.onclick=async()=>{
    desel();
    try{
        const c=await html2canvas(tb,{backgroundColor:'#fff',scale:2,width:W,height:H,x:0,y:0,scrollX:0,scrollY:0,windowWidth:W,windowHeight:H,useCORS:true,allowTaint:true,logging:false,removeContainer:false});
        c.toBlob(b=>{const u=URL.createObjectURL(b),l=document.createElement('a'),t=new Date().toISOString().slice(0,19).replace(/:/g,'-');l.download=`tabletop-${t}.png`;l.href=u;l.click();URL.revokeObjectURL(u)},'image/png')
    }catch(e){alert('Export failed. Try again.')}
};