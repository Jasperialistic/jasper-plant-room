/* Jasper's Plant Room v2.7 — permanent delete for bundled gallery photos */
(function(){
  const style=document.createElement('style');
  style.id='v27PermanentDeleteStyles';
  style.textContent=`
.removed-item .removed-actions{display:grid;grid-template-columns:1fr 1fr}
.removed-item .removed-actions button{width:100%;border:0;border-top:1px solid #263b33;background:#172820;color:var(--text);padding:8px;cursor:pointer}
.removed-item .removed-actions button+button{border-left:1px solid #263b33}
.removed-item .removed-actions .purge-photo{color:#f1b8b8;background:#241817}
@media(max-width:520px){.removed-item .removed-actions{grid-template-columns:1fr}.removed-item .removed-actions button+button{border-left:0}}
`;
  document.head.appendChild(style);

  const originalBasePhotoItems=basePhotoItems;
  basePhotoItems=function(p,{includeHidden=false}={}){
    const paths=baseByLegacy.get(p.legacyId)?.photos||[];
    return paths.map((path,i)=>{
      const m=baseMetaFor(p,path);
      return {
        key:`base:${path}`,base:true,asset_path:path,url:resolveAsset(path),id:m?.id||null,
        sort_order:m?.sort_order??i*10,effective_order:m?.sort_order??i*10,
        hidden:!!m?.hidden,purged:!!m?.purged,is_thumbnail:!!m?.is_thumbnail,
        photo_date:m?.photo_date||null,note:m?.note||''
      };
    }).filter(x=>includeHidden||(!x.hidden&&!x.purged));
  };

  galleryHTML=function(p){
    const arr=galleryPhotos(p);
    const removed=basePhotoItems(p,{includeHidden:true}).filter(x=>x.hidden&&!x.purged);
    const tiles=arr.map((x,i)=>{
      const current=!!x.is_thumbnail||(!arr.some(y=>y.is_thumbnail)&&i===0);
      const label=x.photo_date?fmt(x.photo_date):(x.base?'Collection':'Gallery');
      const caption=x.note?`<div class="gallery-caption">${esc(x.note)}</div>`:'';
      if(!isOwner)return `<div class="gallery-tile" data-gallery-tile-key="${esc(x.key)}"><img data-gallery-preview="${esc(x.key)}" src="${x.url}" alt="${esc(p.name)}"><div class="photo-meta">${current?'Current thumbnail · ':''}${label}${x.note?` · ${esc(x.note)}`:''}</div></div>`;
      return `<div class="gallery-tile manage" data-gallery-tile-key="${esc(x.key)}"><div class="gallery-image-wrap" data-gallery-preview="${esc(x.key)}"><img src="${x.url}" alt="${esc(p.name)}"><div class="photo-meta">${current?'★ Thumbnail · ':''}${label}</div></div>${caption}<div class="gallery-controls"><button class="${current?'primary-control':''}" data-gallery-thumb="${esc(x.key)}">${current?'★ Thumbnail':'☆ Choose thumbnail'}</button><button data-gallery-edit="${esc(x.key)}">Edit</button><button data-gallery-move="-1" data-gallery-key="${esc(x.key)}" ${i===0?'disabled':''}>← Earlier</button><button data-gallery-move="1" data-gallery-key="${esc(x.key)}" ${i===arr.length-1?'disabled':''}>Later →</button><button class="danger-control" data-gallery-delete="${esc(x.key)}" style="grid-column:1/-1">Delete</button></div></div>`;
    }).join('');
    const removedHtml=isOwner&&removed.length?`<div class="removed-gallery"><h4>Removed bundled photos</h4><div class="removed-grid">${removed.map(x=>`<div class="removed-item"><img src="${x.url}" alt=""><div class="removed-actions"><button data-gallery-restore="${esc(x.key)}">Restore</button><button class="purge-photo" data-gallery-purge="${esc(x.key)}" data-gallery-plant="${esc(p.cloudId)}">Delete forever</button></div></div>`).join('')}</div></div>`:'';
    return `${isOwner?'<div class="panel-actions"><button class="ghost small" data-add-photo="gallery">+ Add gallery photo</button></div>':''}<div class="gallery-grid">${tiles}</div>${removedHtml}`;
  };

  async function purgeBundledPhoto(plantId,key){
    if(!requireOwner())return;
    if(!String(key).startsWith('base:'))return;
    const path=String(key).slice(5);
    const ok=confirm('Permanently delete this bundled photo from the plant collection? This cannot be restored from the website.');
    if(!ok)return;
    setCloudStatus('Permanently deleting photo…');
    const res=await sb.from('plant_base_photos').update({hidden:true,purged:true,is_thumbnail:false}).eq('plant_id',plantId).eq('asset_path',path);
    if(res.error){alert(res.error.message);setCloudStatus('Sync error',true);return;}
    await loadCloud();
    openPlant(plantId,'gallery');
  }

  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-gallery-purge]');
    if(!btn)return;
    e.preventDefault();e.stopPropagation();
    purgeBundledPhoto(btn.dataset.galleryPlant,btn.dataset.galleryPurge);
  },true);
})();
