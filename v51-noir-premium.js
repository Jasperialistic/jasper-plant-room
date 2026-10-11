/* Jasper's Plant Room v5.1.0 — Noir Édition premium design language (Direction H).
   Owner-selected tokens: E-style tactile depth × F-style noir/champagne palette,
   Bodoni Moda display + Inter UI (no cursive, no all-sans), single hero
   Anthurium crystallinum artwork per surface. See docs/design/premium-direction.md.
   Pure presentation layer: no data contracts or behaviour are touched. */
(function v51NoirPremium(){
  'use strict';

  document.documentElement.dataset.design='noir';

  const theme=document.querySelector('meta[name="theme-color"]');
  if(theme)theme.content='#080808';

  if(!document.getElementById('v51NoirFonts')){
    const link=document.createElement('link');
    link.id='v51NoirFonts';
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..600&family=Inter:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }

  const style=document.createElement('style');
  style.id='v51NoirStyles';
  style.textContent=`
:root{
  --bg:#080808;--panel:#181512;--panel2:#1C1915;--line:rgba(244,241,236,.12);
  --text:#F4F1EC;--muted:#9A948A;--green:#BFAF95;--accent:#C9B18A;
  --danger:#C98B8B;--warn:#C9B18A;--ok:#C2B294;
  --shadow:0 26px 52px rgba(0,0,0,.55),0 6px 14px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.13);
  --pr-noir:#080808;--pr-espresso:#1C1915;--pr-card-top:#181512;--pr-card-bottom:#100E0B;
  --pr-ivory:#F4F1EC;--pr-muted:#9A948A;--pr-champagne:#C9B18A;--pr-champagne-hi:#E7D6B4;
  --pr-graphite:#221D17;--pr-rim:rgba(244,241,236,.11);
  --kemuri-bg:#080808;--kemuri-ink:#F4F1EC;--kemuri-smoke:#9A948A;--kemuri-line:rgba(244,241,236,.12);
  --kemuri-surface:#181512;--kemuri-surface-raised:#1C1915;
  --kemuri-oxblood:#AE946B;--kemuri-red:#C9B18A;--kemuri-botanical:#BFAF95;
}
html{background:#080808}
body{
  background:
    radial-gradient(700px 400px at 80% -6%,rgba(201,177,138,.13),transparent 60%),
    linear-gradient(180deg,#0A0A0A,#080808 46%,#060606);
  color:var(--pr-ivory);
  font-family:'Inter',ui-sans-serif,system-ui,sans-serif;
}
/* one hero crystallinum leaf — atmospheric page texture (replaces the kemuri grid) */
body::before{
    content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
    background:url('assets/art/wallpaper-leaves.svg') center/cover no-repeat fixed;
    opacity:.38;filter:blur(2.5px);mask-image:none;-webkit-mask-image:none;
}
body::after{
  content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(420px 320px at 4% 55%,rgba(201,177,138,.06),transparent 65%),
    radial-gradient(520px 380px at 96% 82%,rgba(201,177,138,.08),transparent 65%),
    linear-gradient(180deg,rgba(8,8,8,0) 0%,rgba(8,8,8,.26) 78%,rgba(8,8,8,.5) 100%);
}

/* ── typography: Bodoni display × Inter UI ─────────────────────────────── */
.brand strong,.hero h1,.section-head h2,.modal-head h2,#v429PatchNotesDialog h2,
.plant-card h3,.location-card h3,.backlog-card h3,.today-card strong,.queue-main strong{
  font-family:'Bodoni Moda','Georgia',serif!important;font-weight:500!important;letter-spacing:0!important;
}
.hero h1{font-size:clamp(34px,4.6vw,56px);line-height:1.04;text-shadow:0 2px 24px rgba(0,0,0,.55)}
.section-head h2,.modal-head h2,#v429PatchNotesDialog h2{letter-spacing:-.005em}
.eyebrow,.brand span,.detail span,.stat span{
  font-family:'Inter',sans-serif;text-transform:uppercase;letter-spacing:.22em;font-weight:700;
}
.eyebrow{color:var(--pr-champagne)!important;font-size:10px}
.plant-sub,.queue-main span,.location-card p,.timeline-content span{
  font-family:'Inter',sans-serif;color:var(--pr-muted);
}

/* ── image-wrapped hero header ─────────────────────────────────────────── */
.hero{
  position:relative;overflow:hidden;border-radius:26px;
  margin:18px 0 8px;padding:34px 30px 30px;
  background:
    linear-gradient(180deg,rgba(8,8,8,.30) 0%,rgba(8,8,8,.10) 34%,rgba(8,8,8,.66) 100%),
    url('assets/art/header-garden.svg') 82% 64%/118% auto no-repeat;
  border:1px solid var(--pr-rim);
  box-shadow:0 44px 90px rgba(0,0,0,.55),0 10px 26px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.14);
}
.hero p{color:#CFC9BD;max-width:640px}

/* ── depth language: cards ─────────────────────────────────────────────── */
.today-card,.stat,.queue-item,.plant-card,.location-card,.backlog-card,.timeline-item,
.growth-card,.add-plant-card,.rule-box{
  border-color:var(--pr-rim)!important;border-radius:22px!important;
  background:linear-gradient(180deg,#181512,#100E0B)!important;
  box-shadow:0 26px 52px rgba(0,0,0,.55),0 6px 14px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.13)!important;
}
.plant-card:hover,.location-card:hover{
  transform:translateY(-3px);border-color:rgba(201,177,138,.35);
  box-shadow:0 34px 68px rgba(0,0,0,.6),0 8px 18px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.16)!important;
}
.plant-photo,.location-photo,.gallery-tile,.gallery-main-wrap,.growth-card img{
  border-radius:15px!important;background:#0C0B0A;
}
.plant-card .plant-photo{border-radius:15px 15px 0 0!important}
.location-card.has-photo .location-photo{border-radius:15px 15px 0 0!important}
.plant-photo,.gallery-tile img,.growth-card img{
  box-shadow:0 16px 30px rgba(0,0,0,.5),0 2px 6px rgba(0,0,0,.4);
}

/* ── depth language: buttons (champagne primary, espresso secondary) ──── */
.ghost,.primary,.icon-btn,.gallery-controls button,.small-dialog .modal-actions button{
  border-radius:999px!important;font-family:'Inter',sans-serif;font-weight:700;
  letter-spacing:.02em;cursor:pointer;
  transition:background-color 140ms ease,border-color 140ms ease,color 140ms ease,transform 90ms ease;
}
.ghost,.icon-btn{
  background:linear-gradient(180deg,#2A251E,#171410)!important;color:var(--pr-ivory)!important;
  border:1px solid rgba(255,255,255,.13)!important;
  box-shadow:0 14px 26px rgba(0,0,0,.5),0 3px 8px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.2),inset 0 -2px 4px rgba(0,0,0,.3)!important;
}
.ghost:hover,.icon-btn:hover{background:linear-gradient(180deg,#373025,#221C15)!important;border-color:rgba(201,177,138,.4)!important}
.primary,.gallery-controls button.primary-control{
  background:linear-gradient(180deg,#E7D6B4,#C9B18A 55%,#AE946B)!important;
  border:1px solid rgba(231,214,180,.5)!important;color:#171108!important;
  box-shadow:0 18px 36px rgba(174,148,107,.42),0 4px 10px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.7),inset 0 -2px 5px rgba(90,70,40,.42)!important;
}
.primary:hover{background:linear-gradient(180deg,#F0E1C2,#D4BC92 55%,#B99C70)!important}
button:active{transform:translateY(1px)}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role="button"]:focus-visible{
  outline:2px solid var(--pr-champagne)!important;outline-offset:2px;
}

/* ── chips, pills, states ──────────────────────────────────────────────── */
.chip,.status{
  border-radius:999px!important;
  background:rgba(201,177,138,.11)!important;border-color:rgba(201,177,138,.3)!important;
  color:#E7D6B4!important;
  box-shadow:0 8px 18px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.12);
  font-family:'Inter',sans-serif;text-transform:uppercase;letter-spacing:.14em;font-size:10px;font-weight:700;
}
.status.today{background:rgba(201,177,138,.18)!important;border-color:rgba(201,177,138,.5)!important;color:#E7D6B4!important}
.status.overdue{background:rgba(201,139,139,.12)!important;border-color:rgba(201,139,139,.4)!important;color:#E0ABAB!important}
.status.reservoir{background:rgba(191,175,149,.12)!important;border-color:rgba(191,175,149,.38)!important;color:#D6C9AE!important}

/* ── forms ─────────────────────────────────────────────────────────────── */
.toolbar input,.toolbar select,label select,label input,label textarea,
.auth-card input,.small-dialog input,.small-dialog textarea,.small-dialog select{
  background:linear-gradient(180deg,rgba(8,8,8,.55),rgba(28,25,21,.75))!important;
  border-color:var(--pr-rim)!important;border-radius:14px!important;color:var(--pr-ivory)!important;
  box-shadow:inset 0 2px 6px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.07);
}
input::placeholder,textarea::placeholder{color:#75705F}

/* ── dialogs, sheets, tabs ─────────────────────────────────────────────── */
.dialog,#v429PatchNotesDialog,#v441ThumbDialog{
  border-color:var(--pr-rim)!important;border-radius:22px!important;
  background:linear-gradient(180deg,#141210,#0C0B0A)!important;
  box-shadow:0 50px 100px rgba(0,0,0,.72),0 12px 28px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.14)!important;
}
.dialog::backdrop,#v429PatchNotesDialog::backdrop,#v441ThumbDialog::backdrop{
  background:rgba(4,4,4,.82);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
}
.tabs{
  border-radius:16px!important;border-color:var(--pr-rim)!important;
  background:rgba(20,18,16,.85)!important;box-shadow:inset 0 2px 6px rgba(0,0,0,.4),0 1px 0 rgba(255,255,255,.07);
}
.tab{border-radius:11px!important;font-family:'Inter',sans-serif}
.tab.active{
  background:linear-gradient(180deg,#2A251E,#171410)!important;color:#F4F1EC!important;
  box-shadow:0 10px 20px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.18)!important;
}
.profile-tab{border-radius:999px!important;border-color:var(--pr-rim)!important}
.profile-tab.active{background:rgba(201,177,138,.15)!important;color:#E7D6B4!important;border-color:rgba(201,177,138,.35)!important}

/* ── topbar + brand ────────────────────────────────────────────────────── */
.topbar{
  background:rgba(10,9,8,.88)!important;border-bottom-color:rgba(201,177,138,.18)!important;
  backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
}
.brand-mark{
  border-radius:12px!important;border-color:rgba(201,177,138,.4)!important;
  background:linear-gradient(145deg,#2A251E,#131110)!important;color:#E7D6B4!important;
  box-shadow:0 10px 22px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.18)!important;
  font-family:'Bodoni Moda',serif;
}
.cloud-pill{border-color:rgba(201,177,138,.3)!important;background:rgba(201,177,138,.1)!important;color:#E7D6B4!important}
.v416-version{border-color:rgba(201,177,138,.28)!important;color:#C9B18A!important;background:rgba(201,177,138,.08)!important}

/* ── stats: editorial numerals, not dashboards ─────────────────────────── */
.stat strong{font-family:'Bodoni Moda',serif;font-size:30px;font-weight:500}
.stat.due strong{color:#E7D6B4}.stat.overdue strong{color:#D6A0A0}

/* ── mobile chrome ─────────────────────────────────────────────────────── */
.mobile-bottom-nav{background:rgba(12,11,10,.96)!important;border-top-color:rgba(201,177,138,.16)!important}
.mobile-nav-item[data-active="1"]{color:#E7D6B4!important}
.mobile-nav-item[data-active="1"]::before{background:rgba(201,177,138,.6)!important}
.v47-sheet,.v442-upload-queue{
  border-color:var(--pr-rim)!important;
  background:linear-gradient(180deg,#181512,#100E0B)!important;
}
.v442-upload-item{border-color:rgba(244,241,236,.08)!important;background:rgba(244,241,236,.035)!important;border-radius:12px!important}
.v442-upload-item[data-state="complete"] .v442-upload-state{color:#A8C0AE}
.v442-upload-item[data-state="failed"] .v442-upload-state{color:#D6A0A0}

/* ── empty/loading states ──────────────────────────────────────────────── */
.empty{border-color:rgba(201,177,138,.25)!important;color:var(--pr-muted)!important;background:rgba(201,177,138,.04)}
.timeline-date{color:var(--pr-champagne);font-family:'Inter',sans-serif;letter-spacing:.16em;text-transform:uppercase;font-size:10px;font-weight:700}

/* ── restrained interaction; respect motion prefs ─────────────────────── */
@media(max-width:700px),(pointer:coarse){
  .topbar{background:#0D0B0A!important}
  .plant-card:hover,.location-card:hover{transform:none}
  .plant-card,.location-card,.queue-item,.stat,.today-card{
    box-shadow:0 14px 30px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.09)!important;
  }
}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;transition-duration:.001ms!important}}
`;
  document.head.appendChild(style);
})();
