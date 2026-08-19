/* Jasper's Plant Room v4.3.1 — desktop gallery photo overflow menu */
(function(){
  const desktopMq=window.matchMedia('(min-width:701px)');
  let activeTile=null;

  const css=`
@media(min-width:701px){
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-tile.manage{position:relative;overflow:visible}
  body.owner-mode #plantDialog [data-panel="gallery"] .gallery-controls{display:none!important}
  .desktop-gallery-menu-button{
    position:absolute;z-index:18;top:8px;right:8px;width:38px;height:38px;padding:0;border:1px solid rgba(255,255,255,.2);
    border-radius:50%;display:grid;place-items:center;background:rgba(4,10,8,.78);color:#fff;
    font-size:23px;line-height:1;letter-spacing:1px;cursor:pointer;box-shadow:0 5px 14px rgba(0,0,0,.28);
    backdrop-filter:blur(8px);
  }
  .desktop-gallery-menu-button:hover{background:rgba(27,45,38,.95);border-color:#5c7469}
  .desktop-gallery-menu-button:active{transform:scale(.95)}
  #desktopGalleryMenu{
    position:fixed;z-index:2147483400;width:210px;padding:6px;border:1px solid #314a40;border-radius:13px;
    background:#14231d;color:#edf4f0;box-shadow:0 18px 45px rgba(0,0,0,.48);backdrop-filter:blur(14px);
  }
  #desktopGalleryMenu[hidden]{display:none!important}
  #desktopGalleryMenu button{
    width:100%;min-height:42px;padding:0 11px;border:0;border-radius:9px;background:transparent;color:#edf4f0;
    text-align:left;font:inherit;font-size:12px;font-weight:700;cursor:pointer;
  }
  #desktopGalleryMenu button:hover{background:#20352c}
  #desktopGalleryMenu button[disabled]{opacity:.5;cursor:default}
  #desktopGalleryMenu button[disabled]:hover{background:transparent}
  #desktopGalleryMenu button.danger{color:#efb0b0}
  #desktopGalleryMenu button.danger:hover{background:#321f1f}
  #desktopGalleryMenu .desktop-gallery-menu-sep{height:1px;margin:4px 5px;background:#2b4138}
}
`;

  const style=document.createElement('style');
  style.id='v42DesktopGalleryMenuStyles';
  style.textContent=css;
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function desktopOwnerMode(){return desktopMq.matches && document.body.classList.contains('owner-mode');}

  function ensureMenu(){
    let menu=document.getElementById('desktopGalleryMenu');
    if(menu)return menu;
    menu=document.createElement('div');
    menu.id='desktopGalleryMenu';
    menu.hidden=true;
    menu.setAttribute('role','menu');
    document.body.appendChild(menu);
    return menu;
  }

  function closeMenu(){
    const menu=document.getElementById('desktopGalleryMenu');
    if(menu)menu.hidden=true;
    activeTile=null;
  }

  function actionButton(label,source,{disabled=false,danger=false}={}){
    const btn=document.createElement('button');
    btn.type='button';
    btn.textContent=label;
    btn.disabled=disabled;
    if(danger)btn.classList.add('danger');
    btn.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      if(btn.disabled)return;
      closeMenu();
      setTimeout(()=>source?.click(),0);
    };
    return btn;
  }

  function openMenu(tile,anchor){
    if(!desktopOwnerMode())return;
    const menu=ensureMenu();
    const thumb=tile.querySelector('[data-gallery-thumb]');
    const edit=tile.querySelector('[data-gallery-edit]');
    const del=tile.querySelector('[data-gallery-delete]');
    const current=!!thumb && (thumb.classList.contains('primary-control') || /★\s*Thumbnail/i.test(thumb.textContent||''));

    menu.innerHTML='';
    if(thumb)menu.appendChild(actionButton(current?'★ Current thumbnail':'☆ Set as thumbnail',thumb,{disabled:current}));
    if(edit)menu.appendChild(actionButton('Edit date / caption',edit));
    if((thumb||edit)&&del){const sep=document.createElement('div');sep.className='desktop-gallery-menu-sep';menu.appendChild(sep);}
    if(del)menu.appendChild(actionButton('Delete photo',del,{danger:true}));

    activeTile=tile;
    menu.hidden=false;
    const r=anchor.getBoundingClientRect();
    const m=menu.getBoundingClientRect();
    let left=r.right-m.width;
    let top=r.bottom+7;
    left=Math.max(8,Math.min(left,window.innerWidth-m.width-8));
    if(top+m.height>window.innerHeight-8)top=Math.max(8,r.top-m.height-7);
    menu.style.left=left+'px';
    menu.style.top=top+'px';
  }

  function enhanceDesktopMenus(){
    if(!desktopOwnerMode())return;
    const panel=document.querySelector('#plantDialog [data-panel="gallery"]');
    if(!panel)return;
    panel.querySelectorAll('.gallery-tile.manage').forEach(tile=>{
      const wrap=tile.querySelector('.gallery-image-wrap');
      if(!wrap || wrap.querySelector('.desktop-gallery-menu-button'))return;
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='desktop-gallery-menu-button';
      btn.textContent='⋯';
      btn.setAttribute('aria-label','Photo options');
      btn.draggable=false;
      btn.addEventListener('mousedown',e=>e.stopPropagation());
      btn.addEventListener('dragstart',e=>{e.preventDefault();e.stopPropagation();});
      btn.onclick=e=>{
        e.preventDefault();e.stopPropagation();
        const menu=ensureMenu();
        if(!menu.hidden && activeTile===tile){closeMenu();return;}
        openMenu(tile,btn);
      };
      wrap.appendChild(btn);
    });
  }

  document.addEventListener('click',e=>{
    const menu=document.getElementById('desktopGalleryMenu');
    if(!menu || menu.hidden)return;
    if(e.target.closest('#desktopGalleryMenu') || e.target.closest('.desktop-gallery-menu-button'))return;
    closeMenu();
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();},true);
  window.addEventListener('resize',closeMenu,{passive:true});
  window.addEventListener('scroll',closeMenu,{passive:true,capture:true});

  function sync(){requestAnimationFrame(enhanceDesktopMenus);}
  sync();
  const observer=new MutationObserver(sync);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open']});
  if(typeof desktopMq.addEventListener==='function')desktopMq.addEventListener('change',()=>{closeMenu();sync();});
})();
