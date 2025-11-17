// builder.js

// 간단 재료 정의: 각 재료는 색상 스트립으로 표현 (아이콘/레이어 + 캔버스 드로잉 정보)
const INGREDIENTS = [
  { id: 'egg',      label: '계란말이',      img: 'img/계란말이.png' },
  { id: 'lotus',  label: '연근',    img: 'img/연근.png' },
  { id: 'carrot',   label: '당근',      img: 'img/당근.png' },
  { id: 'crab',     label: '게맛살',    img: 'img/게맛살.png' },
  { id: 'sausage',     label: '소세지',  img: 'img/소세지.png' },
  { id: 'cucumber', label: '오이',      img: 'img/오이.png' },
  { id: 'bulgogi',  label: '불고기',      img: 'img/불고기.png' },
  { id: 'fishcake',   label: 'fishcake',      img: 'img/어묵.png' },
  { id: 'pickled',  label: '단무지',    img: 'img/단무지.png' },
];

// 버튼 아이콘을 간단 SVG로 생성 (data URL)
function makeIcon(color){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='12' y='40' width='76' height='20' rx='10' fill='${color}'/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const ELLIPSE = {
  cyRatio: 140/280,  // 0.5
  ryRatio:  70/280   // 0.25
};

const grid = document.getElementById('ingredientsGrid');
const stack = document.getElementById('stack');
const btnReset = document.getElementById('btnReset');
const btnDone = document.getElementById('btnDone');

const modal = document.getElementById('doneModal');
const modalClose = document.getElementById('modalClose');
const btnSave = document.getElementById('saveRecipe');

let layers = []; // 쌓은 재료 id 순서
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let layerCount = 0;
const STRIP_SPACING = 16;   // 화면 상 쌓이는 간격(px)
const STRIP_HEIGHT  = 14;   // 스트립 높이(px)

const nameInput = document.getElementById('recipeName');

btnDone.addEventListener('click', () => {
  const resultImage = document.getElementById('resultImage');
  resultImage.src = 'img/김밥.png'; // ✅ 원하는 이미지 경로
  openModal();
});

function renderButtons() {
grid.innerHTML = '';
  INGREDIENTS.forEach(ing => {
    const btn = document.createElement('button');
    btn.className = 'ing-btn';

    // 이미지
    const img = document.createElement('img');
    img.src = ing.img;
    img.alt = ing.label;

    // ✅ 레이블 요소 추가
    const label = document.createElement('div');
    label.className = 'ingredient-label';
    label.innerText = ing.label;

    btn.appendChild(img);
    btn.appendChild(label);

    btn.addEventListener('click', () => addLayer(ing));
    grid.appendChild(btn);
  });
}

function addLayer(ing) {
  const stackEl = document.getElementById('stack');
  const H = stackEl.clientHeight;
  const W = stackEl.clientWidth;

  const cx = W / 2; // 중심 X
  const cy = H / 2; // 중심 Y

  const img = document.createElement('img');
  img.src = ing.img;
  img.alt = ing.label;
  img.className = 'ingredient-img';
  img.style.position = 'absolute';
  img.style.width = '100px';
  img.style.height = '100px';
  img.style.pointerEvents = 'none';
  
const angleDeg = 25 * layerCount; // 시계 방향 회전 각도
const angleRad = angleDeg * (Math.PI / 180);
const radius = 70; // ✅ 고정 반지름: 완전히 겹치진 않게 약간만 벌림

  const x = cx + radius * Math.cos(angleRad) - 40;
  const y = cy + radius * Math.sin(angleRad) - 40;

  img.style.left = `${x}px`;
  img.style.top = `${y}px`;

  stackEl.appendChild(img);

  layers.push(ing.id);
  layerCount++;
}

// 리셋
function resetStack(){
  layers = [];
  layerCount = 0;
  stack.innerHTML = '';
}

// 모달 열고 닫기
function openModal(){
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal(){
  modal.setAttribute('aria-hidden', 'true');
}

// 캔버스에 완성 이미지 그리기 (김 + 밥 + 재료)
function drawResultToCanvas(){
  // 배경 하양
  ctx.clearRect(0,0,canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,canvas.width, canvas.height);

  // 김 (rounded rect)
  const seaweed = { x:40, y:60, w:520, h:240, r:28 };
  drawRoundRect(ctx, seaweed.x, seaweed.y, seaweed.w, seaweed.h, seaweed.r, '#17261f');

  // 밥 (ellipse)
  const riceFill = RICE_COLORS[riceType || 'white'];
  drawEllipse(ctx, 300, 180, 240, 100, riceFill);

  // 재료: layers 순서대로 중앙에 스트립
  let i = 0;
  for(const id of layers){
    const ing = INGREDIENTS.find(x => x.id === id) || {color:'#ccc'};
    const y = 180 - (i * (STRIP_SPACING * 1.1));
    drawStrip(ctx, 180, y, 240, STRIP_HEIGHT * 1.1, 10, ing.color);
    i++;
  }

  ctx.fillStyle = '#2B2B2B';
  ctx.font = 'bold 28px Pretendard, system-ui, -apple-system, Segoe UI, Roboto';
  ctx.fillText('나만의 김밥 완성!', 24, 40);
}

function drawRoundRect(ctx, x, y, w, h, r, fill){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawEllipse(ctx, cx, cy, rx, ry, fill){
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawStrip(ctx, cx, cy, w, h, r, fill){
  drawRoundRect(ctx, cx, cy, w, h, r, fill);
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderButtons();

    // ① 입장 시 밥 선택 모달 열기
  const riceModal = document.getElementById('riceModal');
  riceModal.setAttribute('aria-hidden','false'); // 팝업 열림

  // ② 선택 버튼 클릭 → 색 적용 → 모달 닫기
  document.getElementById('btnChooseWhite')?.addEventListener('click', ()=>{
    applyRiceColor('white');
    riceModal.setAttribute('aria-hidden','true');
  });
  document.getElementById('btnChooseBrown')?.addEventListener('click', ()=>{
    applyRiceColor('brown');
    riceModal.setAttribute('aria-hidden','true');
  });

  btnReset.addEventListener('click', resetStack);

  btnDone.addEventListener('click', ()=>{
    drawResultToCanvas();
    openModal();
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{
    if(e.target.classList.contains('modal-backdrop')) closeModal();
  });

  btnSave.addEventListener('click', ()=>{
    if(layers.length === 0){
      alert('재료를 하나 이상 추가해 주세요!');
      return;
    }
    saveRecipe();
  });
    const nameInput = document.getElementById('recipeName');
  nameInput?.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      e.preventDefault(); 
      btnSave.click();    
    }
  });
});

function saveRecipe(){
  const dataUrl = canvas.toDataURL('image/png');
  const saved = JSON.parse(localStorage.getItem('pr_recipes') || '[]');
  const stamp = Date.now();

  const rawName = (nameInput?.value || '').trim();
  if(!rawName){
    alert('레시피 이름을 입력해 주세요!');
    nameInput?.focus();
    return;
  }

    if(!riceType){
    alert('밥을 먼저 선택해 주세요!');
    return;
  }

  const recipe = {
    id: 'pr_' + stamp,
    at: stamp,
    name: rawName,    
    rice: riceType,           
    ingredients: layers.slice(),
    thumb: dataUrl
  };

  saved.unshift(recipe);
  localStorage.setItem('pr_recipes', JSON.stringify(saved));
  alert('저장되었습니다! 서브2에서 확인해 보세요.');
  closeModal();

  window.location.href = 'sub2.html';
}

// === 밥 선택 상태 및 색상 ===
let riceType = null; // 'white' | 'brown'

// SVG 밥(ellipse) 요소 캐시
const riceEl = document.querySelector('.stage-svg .svg-rice');

// 색상 정의 (SVG/Canvas 공용)
const RICE_COLORS = {
  white: '#f3f4f6',   // 기존 흰쌀밥
  brown: '#e7d8b8'    // 잡곡/현미 톤
}
function applyRiceColor(type) {
  riceType = type;

  const riceBg = document.getElementById('riceBackground');

  if (riceBg) {
    if (type === 'white') {
      riceBg.src = 'img/bab.png.png';
    } else if (type === 'brown') {
      riceBg.src = 'img/bab2.png.png';
    }
  }
}