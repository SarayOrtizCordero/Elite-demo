(function(){
  var $=function(id){return document.getElementById(id)};
  var WHATSAPP=""; // PENDIENTE: número de Elite en formato internacional, ej. 584141234567
  var PRICE=4;     // precio por bicicleta ($)

  var TOTAL=14;
  var DN=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"], MN=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  var KEY="elite-reservas";
  var state={day:0,slot:2,sel:[]}, lastBtn=null;

  // Horario de ejemplo (PENDIENTE: horarios definitivos)
  var SLOTS=["6:00 AM","7:30 AM","9:00 AM","5:30 PM","7:00 PM"];
  var SLOT_MIN=[360,450,540,1050,1140];
  var ROWS_MAP=[[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14]];
  var ROWS=[5,5,4];

  var fmt=function(n){return n+" $"};
  var days=[], d=new Date();
  while(days.length<5){ if(d.getDay()!==0&&d.getDay()!==6) days.push(new Date(d)); d.setDate(d.getDate()+1); }
  var dkey=function(x){return x.getFullYear()+"-"+(x.getMonth()+1)+"-"+x.getDate()};
  var dlabel=function(x){return DN[x.getDay()]+" "+x.getDate()+" "+MN[x.getMonth()]};
  function store(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}}
  function save(o){try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
  // Disponibilidad simulada (PENDIENTE: conectar con reservas reales)
  function taken(di,si){
    var seed=(di+1)*31+(si+1)*17, out=[], n=3+(seed%6), k=seed;
    while(out.length<n){k=(k*37+11)%997; var b=(k%TOTAL)+1; if(out.indexOf(b)<0) out.push(b);}
    (store()[dkey(days[di])+"|"+si]||[]).forEach(function(b){if(out.indexOf(b)<0) out.push(b)});
    return out;
  }
  var free=function(di,si){return TOTAL-taken(di,si).length};

  /* ---- Reservar: días y clases ---- */
  function renderDays(){
    var today=new Date().toDateString();
    $("days").innerHTML=days.map(function(x,i){
      return '<button type="button" class="day" data-i="'+i+'" aria-pressed="'+(i===state.day)+'"><small>'+(x.toDateString()===today?"Hoy":DN[x.getDay()])+'</small><strong>'+x.getDate()+' '+MN[x.getMonth()]+'</strong></button>';
    }).join("");
  }
  function isPast(di,si){
    var n=new Date();
    return days[di].toDateString()===n.toDateString() && n.getHours()*60+n.getMinutes()>=SLOT_MIN[si];
  }
  function renderList(){
    var shownNext=false;
    $("list").innerHTML=SLOTS.map(function(s,i){
      if(isPast(state.day,i)) return "";
      var f=free(state.day,i), dots="", nxt=false;
      if(!shownNext && f>0 && days[state.day].toDateString()===new Date().toDateString()){nxt=true; shownNext=true;}
      for(var k=0;k<TOTAL;k++) dots+='<i class="'+(k<f?"":"t")+'"></i>';
      return '<div class="row'+(f===0?" full":"")+(nxt?" next":"")+'"><div class="time">'+s.replace(" ","<small>")+'</small>'+(nxt?'<em class="tag-next">Próxima</em>':'')+'</div>'+
        '<div class="seats"><span class="dots" aria-hidden="true">'+dots+'</span><span>'+(f===0?"Clase llena":f+(f===1?" bici libre":" bicis libres"))+'</span></div>'+
        (f===0?"":'<button class="btn sm" type="button" data-i="'+i+'" aria-label="Elegir bici, clase de las '+s+'">Elegir bici</button>')+'</div>';
    }).join("")||'<p class="fine">Hoy ya terminaron las clases. Elige otro día.</p>';
  }
  $("days").addEventListener("click",function(e){var b=e.target.closest(".day"); if(!b) return; state.day=+b.dataset.i; renderDays(); renderList();});
  $("list").addEventListener("click",function(e){var b=e.target.closest("button[data-i]"); if(!b) return; openCard(+b.dataset.i,b);});

  /* ---- Plano de la sala (14 bicis, 5-5-4) ---- */
  var n=0;
  $("plan").innerHTML=ROWS.map(function(c){
    var h='<div class="pr">';
    for(var i=0;i<c;i++){n++; h+='<span class="pb" style="--i:'+n+'">'+n+'</span>';}
    return h+'</div>';
  }).join("");
  /* ---- Ventana de reserva ---- */
  var dlg=$("buy");
  function view(n){["vPick","vForm","vDone"].forEach(function(v){$(v).hidden=(v!==n)}); dlg.scrollTop=0;}
  function renderMap(){
    var t=taken(state.day,state.slot);
    $("rows").innerHTML=ROWS_MAP.map(function(r){
      return '<div class="mrow">'+r.map(function(num){
        var oc=t.indexOf(num)>-1, on=state.sel.indexOf(num)>-1;
        return '<button type="button" class="b" data-n="'+num+'" aria-pressed="'+on+'"'+(oc?" disabled":"")+' aria-label="Bici '+num+', '+(oc?"ocupada":on?"tuya":"libre")+'">'+num+'</button>';
      }).join("")+'</div>';
    }).join("");
    updatePick();
  }
  function updatePick(){
    var n=state.sel.length, sorted=state.sel.slice().sort(function(a,b){return a-b});
    $("picked").textContent = n===0 ? "Toca una bici libre." : "Tuya: "+sorted.join(", ");
    $("pTotal").textContent=fmt(n*PRICE);
    $("pNote").textContent=n===0?"Sin bicis":n+(n===1?" bici":" bicis")+" × "+fmt(PRICE);
    $("toForm").disabled=n===0;
  }
  function openCard(si,from){
    state.slot=si; state.sel=[]; lastBtn=from;
    var w=dlabel(days[state.day])+" · "+SLOTS[si];
    $("cWhen").textContent=w; $("fWhen").textContent=w;
    renderMap(); view("vPick");
    if(dlg.showModal) dlg.showModal(); else dlg.setAttribute("open","");
    document.body.classList.add("lock");
  }
  function closeDlg(){ if(dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  dlg.addEventListener("close",function(){document.body.classList.remove("lock"); renderList(); if(lastBtn) lastBtn.focus();});
  $("buyClose").addEventListener("click",closeDlg);
  dlg.addEventListener("click",function(e){ if(e.target===dlg) closeDlg(); });
  $("rows").addEventListener("click",function(e){
    var b=e.target.closest(".b"); if(!b||b.disabled) return;
    var n=+b.dataset.n, i=state.sel.indexOf(n);
    if(i>-1) state.sel.splice(i,1); else state.sel.push(n);
    b.setAttribute("aria-pressed",String(i<0));
    b.setAttribute("aria-label","Bici "+n+", "+(i<0?"tuya":"libre"));
    updatePick();
  });
  $("toForm").addEventListener("click",function(){
    var n=state.sel.length, s2=state.sel.slice().sort(function(a,b){return a-b});
    $("fSum").textContent=(n===1?"Bici ":"Bicis ")+s2.join(", ");
    $("fTotal").textContent=fmt(n*PRICE);
    view("vForm"); $("vForm").name.focus({preventScroll:true});
  });
  $("back").addEventListener("click",function(){view("vPick")});
  $("again").addEventListener("click",function(){state.sel=[]; renderMap(); view("vPick")});
  function bad(id,v){$(id).classList.toggle("bad",v)}
  $("vForm").addEventListener("submit",function(e){
    e.preventDefault();
    var f=e.target, name=f.name.value.trim(), wa=f.wa.value.trim();
    var okN=name.split(/\s+/).length>=2&&name.length>=5, okW=wa.replace(/\D/g,"").length>=7;
    bad("f-name",!okN); bad("f-wa",!okW);
    if(!(okN&&okW)){var el=f.querySelector(".bad input"); if(el) el.focus(); return;}
    var all=store(), k=dkey(days[state.day])+"|"+state.slot;
    all[k]=(all[k]||[]).concat(state.sel); save(all);
    var bikes=state.sel.slice().sort(function(a,b){return a-b}), when=dlabel(days[state.day])+" · "+SLOTS[state.slot], total=fmt(bikes.length*PRICE);
    var msg="Hola, reservé en Elite Spinning: "+when+", "+(bikes.length>1?"bicis ":"bici ")+bikes.join(", ")+". Total "+total+". A nombre de "+name+".";
    $("doneMsg").textContent=when+" · "+(bikes.length>1?"bicis ":"bici ")+bikes.join(", ")+" · "+total;
    $("waBtn").href="https://wa.me/"+WHATSAPP+"?text="+encodeURIComponent(msg);
    state.sel=[]; f.reset(); view("vDone"); $("doneTitle").focus();
  });
  ["name","wa"].forEach(function(k){$("vForm")[k].addEventListener("input",function(){this.closest(".field").classList.remove("bad")})});

  /* ---- Menú móvil y cabecera ---- */
  var hdr=$("top"), burger=$("burger");
  function setMenu(o){hdr.classList.toggle("open",o); burger.setAttribute("aria-expanded",String(o)); burger.setAttribute("aria-label",o?"Cerrar menú":"Abrir menú");}
  addEventListener("keydown",function(e){if(e.key==="Escape"&&hdr.classList.contains("open")){setMenu(false);burger.focus()}});
  burger.addEventListener("click",function(){setMenu(!hdr.classList.contains("open"))});
  $("nav").addEventListener("click",function(e){if(e.target.closest("a")) setMenu(false)});
  var fab=$("fab"), rsv=$("reservar");
  function onScroll(){
    hdr.classList.toggle("stuck",scrollY>8);
    var r=rsv.getBoundingClientRect(), inRsv=r.top<innerHeight*.6&&r.bottom>innerHeight*.3;
    fab.classList.toggle("show",scrollY>innerHeight*.6&&!inRsv);
  }
  addEventListener("scroll",onScroll,{passive:true}); onScroll();

  $("yr").textContent=new Date().getFullYear();

  renderDays(); renderList();

  /* ---- Reveal ---- */
  var els=document.querySelectorAll(".rv");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("in");io.unobserve(en.target)}})},{threshold:.12,rootMargin:"0px 0px -6% 0px"});
    els.forEach(function(el){io.observe(el)});
  } else els.forEach(function(el){el.classList.add("in")});
})();
