/* Jasper's Plant Room v2.6 — desktop photo-fit override */
(function(){
  const style=document.createElement('style');
  style.id='v26DesktopPhotoFit';
  style.textContent=`
@media (min-width:651px){
  #photoLightbox .photo-lightbox-stage{
    box-sizing:border-box!important;
    padding:16px 88px!important;
  }
  #photoLightbox .photo-lightbox-img{
    display:block!important;
    width:auto!important;
    height:auto!important;
    max-width:min(82vw,1180px)!important;
    max-height:min(76dvh,820px)!important;
    object-fit:contain!important;
    border-radius:8px;
  }
  #photoLightbox .photo-lightbox-prev{left:24px!important}
  #photoLightbox .photo-lightbox-next{right:24px!important}
}
`;
  document.head.appendChild(style);
})();
