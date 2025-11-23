let nameInput;

// 간단 재료 정의: 각 재료는 색상 스트립으로 표현 (아이콘/레이어 + 캔버스 드로잉 정보)
const INGREDIENTS = [
  { id: 'egg',      label: '계란말이',      img: 'img/계란말이.png' },
  { id: 'lotus',  label: '연근',    img: 'img/연근.png' },
  { id: 'carrot',   label: '당근',      img: 'img/당근.png' },
  { id: 'crab',     label: '게맛살',    img: 'img/게맛살.png' },
  { id: 'sausage',     label: '소세지',  img: 'img/소세지.png' },
  { id: 'cucumber', label: '오이',      img: 'img/오이.png' },
  { id: 'bulgogi',  label: '불고기',      img: 'img/불고기.png' },
  { id: 'fishcake',   label: '어묵',      img: 'img/어묵.png' },
  { id: 'pickled',  label: '단무지',    img: 'img/단무지.png' },
];

// 버튼 아이콘을 간단 SVG로 생성 (data URL)
function makeIcon(color){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect x='12' y='40' width='76' height='20' rx='10' fill='${color}'/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
const MAX_INGREDIENTS = 10;
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

// builder.js 파일 (addLayer 함수)

function addLayer(ing) {
  // 1. 최대 개수 제한 체크
  if (layerCount >= MAX_INGREDIENTS) {
    alert(`재료는 최대 ${MAX_INGREDIENTS}개까지만 추가할 수 있습니다!`);
    return;
  }

  const stackEl = document.getElementById('stack');
  const H = stackEl.clientHeight;
  const W = stackEl.clientWidth;
  
  // ⭐️ 핵심 수정 1: 원형 배치의 순수한 중심점 (stack의 중앙) ⭐️
  // cx_pure, cy_pure 변수를 그대로 사용하거나, cx, cy로 이름을 통일합니다.
  const cx = W / 2; // 원형 배치의 X 기준점
  const cy = H / 2; // 원형 배치의 Y 기준점

  // ✅ 최종 위치 이동 오프셋 정의
  const offsetX_final = 5;  // 최종 이미지 위치 오른쪽으로 5px 이동
  const offsetY_final = 10; // 최종 이미지 위치 아래쪽으로 10px 이동

  // 2. 배치 설정 (두 개의 동심원 로직)
  let currentRadius;
  let currentSize;
  let angleDeg;
  let numItemsInCurrentCircle; 
  let itemIndexInCurrentCircle;

  if (layerCount < 5) { // ✅ 안쪽 원 (0번째 ~ 4번째 재료)
    numItemsInCurrentCircle = 5;
    itemIndexInCurrentCircle = layerCount; // 0, 1, 2, 3, 4

    currentRadius = 50; // 안쪽 원의 반지름 (작게 설정)
    currentSize = 50;   // 안쪽 원 재료 이미지 크기 (작게 설정) 
    
  } else { // ✅ 바깥쪽 원 (5번째 ~ 9번째 재료)
    numItemsInCurrentCircle = 5;
    itemIndexInCurrentCircle = layerCount - 5; // 0, 1, 2, 3, 4
    
    currentRadius = 120; // 바깥쪽 원의 반지름 (더 크게 설정)
    currentSize = 70;    // 바깥쪽 원 재료 이미지 크기 (크게 설정)
  }

  // ✅ 각도 계산 (현재 원 내의 아이템 개수와 인덱스 기반)
  angleDeg = (360 / numItemsInCurrentCircle) * itemIndexInCurrentCircle;
  const angleRad = angleDeg * (Math.PI / 180);

  // 3. 이미지 요소 생성 및 스타일 적용
  const img = document.createElement('img');
  img.src = ing.img;
  img.alt = ing.label;
  img.className = 'ingredient-img';
  img.style.position = 'absolute';
  
  // 동적으로 계산된 크기 적용
  img.style.width = `${currentSize}px`;
  img.style.height = `${currentSize}px`;

  // 4. 이미지 위치 계산 및 적용 (중심점 + 반지름 이동 후, 이미지 중심 보정)
  const imageCenterOffset = currentSize / 2; // 이미지 크기의 절반만큼 빼서 이미지 중앙이 계산된 위치에 오도록 보정
  
  // ⭐️ 핵심 수정 2: 순수 중심점 (cx, cy)를 사용하여 원형 위치 계산 ⭐️
  
  // 원형 배치 위치 (이미지 좌상단 기준)
  let targetX = cx + currentRadius * Math.cos(angleRad) - imageCenterOffset;
  let targetY = cy + currentRadius * Math.sin(angleRad) - imageCenterOffset;
  
  // ✅ 최종 이미지 위치 오프셋 추가
  targetX += offsetX_final;
  targetY += offsetY_final;

  img.style.left = `${targetX}px`;
  img.style.top = `${targetY}px`;

  stackEl.appendChild(img);

  layers.push(ing.id);
  layerCount++;
}

// 리셋
function resetStack(){
  layers = [];
  layerCount = 0; // ✅ layerCount도 0으로 리셋
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

function saveRecipe(){
  drawResultToCanvas();
  const dataUrl = canvas.toDataURL('image/png'); // 썸네일 데이터 URL 생성
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
      riceBg.src = 'img/밥.png';
    } else if (type === 'brown') {
      riceBg.src = 'img/현미밥.png';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1) 재료 버튼 렌더링
  renderButtons();

  // 2) 입장 시 밥 선택 모달 열기
  const riceModal = document.getElementById('riceModal');
  riceModal.setAttribute('aria-hidden','false');

  document.getElementById('btnChooseWhite')?.addEventListener('click', () => {
    applyRiceColor('white');
    riceModal.setAttribute('aria-hidden','true');
  });

  document.getElementById('btnChooseBrown')?.addEventListener('click', () => {
    applyRiceColor('brown');
    riceModal.setAttribute('aria-hidden','true');
  });

  // 3) 스택 리셋
  btnReset.addEventListener('click', resetStack);

  // 4) Done 버튼 → stage 캡처 후 모달 열기
  btnReset.addEventListener('click', resetStack);

  // 4) Done 버튼 → stage 캡처 후 모달 열기 + “이미지 생성 완료!” 알림
  btnDone.addEventListener('click', () => {
    const stageBase   = document.querySelector('.stage-base');
    const resultImage = document.getElementById('resultImage');
    if (!stageBase || !resultImage) return;

    // html2canvas가 없으면 일단 모달만 열기
    if (typeof html2canvas !== 'function') {
      alert('이미지 생성 완료!');  // ✅ 간단 안내
      openModal();
      return;
    }

    // 1) stage-base 전체 캡처 (밥 + 속재료 전부 포함)
    html2canvas(stageBase, {
      backgroundColor: null,  // 배경 투명 (원하면 '#ffffff')
      scale: 2                // 해상도 업
    })
    .then(canvasCap => {
      // 2) 캡처 결과를 dataURL로 만들기
      const dataUrl = canvasCap.toDataURL('image/png');

      // 3) 팝업 이미지로 적용
      resultImage.src = dataUrl;

      // 4) 안내 메시지 → 완료 모달 열기
      alert('이미지 생성 완료!');   // ✅ 여기서 “이미지 생성 완료!” 팝업
      openModal();

      // ※ 나중에 QR / roll-viewer 붙이고 싶으면
      //    여기에서 viewerUrl 만들고 버튼 이벤트를 추가하면 됨.
      // const viewerUrl = `${location.origin}/picknroll/roll-viewer.html?img=${encodeURIComponent(dataUrl)}`;
      // const btnQr = document.getElementById('btnQr');
      // if (btnQr) {
      //   btnQr.onclick = () => openQrWindow(viewerUrl);
      // }
    })
    .catch(err => {
      console.error(err);
      alert('이미지를 만드는 중에 오류가 났어요 ㅠㅠ');
    });
  });

  // 5) 완료 모달 닫기
  modalClose.addEventListener('click', closeModal);

  // 5) 완료 모달 닫기
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });

  // 6) 레시피 저장 버튼
  btnSave.addEventListener('click', () => {
    if (layers.length === 0) {
      alert('재료를 하나 이상 추가해 주세요!');
      return;
    }
    saveRecipe();
  });

  // 7) 이름 입력 + Enter 키 처리 (전역 nameInput에 저장)
  nameInput = document.getElementById('recipeName');
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnSave.click();
    }
  });

  // 8) 재료 드래그 로직 (10개 쌓인 후에만)
  const stageBase = document.querySelector('.stage-base');
  if (stageBase) {
    let activeImg = null;
    let offsetX = 0;
    let offsetY = 0;

    stageBase.addEventListener('mousedown', (e) => {
      if (layerCount < MAX_INGREDIENTS) return;

      const target = e.target;
      if (!target.classList.contains('ingredient-img')) return;

      activeImg = target;
      activeImg.style.cursor = 'grabbing';

      const rect = activeImg.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
      if (!activeImg) return;

      const containerRect = stageBase.getBoundingClientRect();
      const x = e.clientX - containerRect.left - offsetX;
      const y = e.clientY - containerRect.top - offsetY;

      activeImg.style.left = x + 'px';
      activeImg.style.top  = y + 'px';
    }

    function onMouseUp() {
      if (!activeImg) return;
      activeImg.style.cursor = 'grab';
      activeImg = null;

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  }
});

function openQrWindow(urlForQr) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ROLL QR</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
      <style>
        body {
          margin:0;
          height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#f5f5f5;
        }
      </style>
    </head>
    <body>
      <div id="qrcode"></div>
      <script>
        new QRCode(document.getElementById('qrcode'), {
          text: ${JSON.stringify(urlForQr)},
          width: 256,
          height: 256
        });
      <\/script>
    </body>
    </html>
  `);
}