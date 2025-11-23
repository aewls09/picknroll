// archive.js
const grid = document.getElementById('archiveGrid');

const modal = document.getElementById('archiveModal');
const arcClose = document.getElementById('arcClose');
const arcImage = document.getElementById('arcImage');
const arcIngredients = document.getElementById('arcIngredients');
const arcDelete = document.getElementById('arcDelete');

let currentId = null;

function hueFromString(str){
  let h = 0;
  for(let i=0;i<str.length;i++){
    h = (h * 31 + str.charCodeAt(i)) >>> 0; // 간단 해시
  }
  return h % 360;
}

function timeStr(ts){
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function ingredientLabel(id){
  const found = ING.find(x=>x.id===id);
  return found ? found.label : id;
}

// INGREDIENT 미니 사전 (서브2에서도 라벨 노출용)
const ING = [
  { id: 'egg',      label: '계란말이'},
  { id: 'lotus',  label: '연근'},
  { id: 'carrot',   label: '당근'},
  { id: 'crab',     label: '게맛살'},
  { id: 'sausage',     label: '소세지'},
  { id: 'cucumber', label: '오이'},
  { id: 'bulgogi',  label: '불고기'},
  { id: 'fishcake',   label: 'fishcake'},
  { id: 'pickled',  label: '단무지'},
];

function render(){
  
  const saved = JSON.parse(localStorage.getItem('pr_recipes') || '[]');
  grid.innerHTML = '';
  const list = saved.filter(matchesFilter);
  if(!saved.length){
    grid.innerHTML = `<p style="grid-column:1/-1;color:#9aa1a6">아직 저장된 레시피가 없습니다. 서브1에서 레시피를 저장해 보세요.</p>`;
    return;
  }
     if (!list.length) {
    grid.innerHTML = `<p style="grid-column:1/-1; color:#9aa1a6; text-align:center; padding:2rem 0;">
      이런, 적용되는 사례가 없네요! 직접 만들러 가볼까요?
    </p>`;
    return;
  }
list.forEach(rec => {
  const card = document.createElement('button');
  card.className = 'folder-card';
  card.innerHTML = `
    <span class="folder-tab"></span>
    <span class="folder-name">${rec.name || '레시피'}</span>
    <span class="folder-time">${timeStr(rec.at)}</span>
    <img class="folder-thumb" src="img/로고김밥.png" alt="완성 썸네일"/>
  `;
  setFolderColors(card, rec.name || rec.id);
  card.addEventListener('click', () => openDetail(rec.id));
  grid.appendChild(card);
});

}


function openDetail(id){
  const saved = JSON.parse(localStorage.getItem('pr_recipes') || '[]');
  const rec = saved.find(x=>x.id===id);
  if(!rec) return;
  currentId = id;

  document.getElementById('arcTitle').textContent = rec.name || '레시피 상세';  // ✅

  arcImage.src = 'img/김밥.png';
  arcImage.alt = rec.name || '완성 썸네일';

  arcIngredients.innerHTML = '';
    if(rec.rice){
    const li = document.createElement('li');
    li.textContent = `밥: ${rec.rice === 'brown' ? '현미밥' : '쌀밥'}`;
    arcIngredients.appendChild(li);
  }
  if(rec.ingredients && rec.ingredients.length){
    const counts = {};
    rec.ingredients.forEach(i => counts[i] = (counts[i]||0)+1);
    Object.entries(counts).forEach(([id, cnt])=>{
      const li = document.createElement('li');
      li.textContent = `${ingredientLabel(id)} × ${cnt}`;
      arcIngredients.appendChild(li);
    });
  }else{
    arcIngredients.innerHTML = '<li>재료 정보 없음</li>';
  }

  modal.setAttribute('aria-hidden', 'false');
}

function closeDetail(){
  modal.setAttribute('aria-hidden','true');
  currentId = null;
}

function deleteCurrent(){
  if(!currentId) return;
  const saved = JSON.parse(localStorage.getItem('pr_recipes') || '[]');
  const next = saved.filter(x=>x.id !== currentId);
  localStorage.setItem('pr_recipes', JSON.stringify(next));
  closeDetail();
  render();
}

document.addEventListener('DOMContentLoaded', ()=>{
  render();
  updateFilterBadge();

   // === 필터 UI 핸들러 ===
  const filterModal = document.getElementById('filterModal');
  const filterToggle = document.getElementById('filterToggle');
  const filterClose = document.getElementById('filterClose');
  const filterApply = document.getElementById('filterApply');
  const filterReset = document.getElementById('filterReset');

  // 모달 열 때: 현재 상태를 UI에 반영
  function syncFilterUI(){
    // 밥

  document.getElementById('rice-white').checked = filterState.rice.has('white');
  document.getElementById('rice-brown').checked = filterState.rice.has('brown');
  const whiteBox = document.getElementById('rice-white');
  const brownBox = document.getElementById('rice-brown');

    // 재료 9개
    const ingChecks = Array.from(document.querySelectorAll('#ingFilterGrid .chip-check'));
    ingChecks.forEach(input=>{
      const id = input.dataset.ing; // egg...
      input.checked = filterState.ings.has(id);
    });
  }

  function openFilter(){
    syncFilterUI();
    filterModal.setAttribute('aria-hidden','false');
  }
  function closeFilter(){
    filterModal.setAttribute('aria-hidden','true');
  }

  filterToggle.addEventListener('click', openFilter);
  filterClose.addEventListener('click', closeFilter);
  filterModal.addEventListener('click', (e)=>{
    if(e.target.classList.contains('modal-backdrop')) closeFilter();
  });
  
  const whiteBox = document.getElementById('rice-white');
  const brownBox = document.getElementById('rice-brown');

  function handleRiceToggle(e) {
  const id = e.target.id === 'rice-white' ? 'white' : 'brown';
  const other = id === 'white' ? brownBox : whiteBox;

  if (e.target.checked) {
    // 다른 항목 해제
    other.checked = false;
    filterState.rice.clear();
    filterState.rice.add(id);
  } else {
    // 같은 항목 다시 누르면 해제됨 → 선택 없음 상태
    filterState.rice.delete(id);
  }
}

whiteBox?.addEventListener('change', handleRiceToggle);
  brownBox?.addEventListener('change', handleRiceToggle);

  // 속재료: 최대 3개 제한
  const ingChecks = Array.from(document.querySelectorAll('#ingFilterGrid .chip-check'));
  ingChecks.forEach(input=>{
    input.addEventListener('change', (e)=>{
      const id = e.target.dataset.ing;
      if(e.target.checked){
        if(filterState.ings.size >= MAX_ING_SELECTED){
          // 최대 초과 시 되돌리기
          e.target.checked = false;
          // 안내 (선택적으로 토스트/아우라)
          alert('속재료는 최대 3개까지 선택할 수 있어요.');
          return;
        }
        filterState.ings.add(id);
      }else{
        filterState.ings.delete(id);
      }
    });
  });
  
  const onlyWithRiceEl = document.getElementById('onlyWithRice');
  onlyWithRiceEl?.addEventListener('change', (e)=>{
    filterState.onlyWithRice = e.target.checked;
  });

  // 초기화
  filterReset.addEventListener('click', ()=>{
    filterState.rice.clear();
    filterState.ings.clear();
    filterState.applied = false;
    filterState.onlyWithRice = false; 
    syncFilterUI();
  });

  // 적용
  filterApply.addEventListener('click', ()=>{
    // applied 플래그 True
    filterState.applied = (filterState.rice.size > 0 || filterState.ings.size > 0);
    closeFilter();
    render(); // 필터 반영하여 다시 그림
  });

  arcClose.addEventListener('click', closeDetail);
  modal.addEventListener('click', (e)=>{
    if(e.target.classList.contains('modal-backdrop')) closeDetail();
  });
  arcDelete.addEventListener('click', deleteCurrent);
});

function setFolderColors(el, seedStr){
  const h = hueFromString(seedStr || '');
  // 파스텔 계열 톤 추천값
  const light = `hsl(${h} 90% 88%)`;
  const border = `hsl(${h} 55% 70%)`;
  const tab = `hsl(${h} 95% 75%)`;

  el.style.setProperty('--folderLight', light);
  el.style.setProperty('--folderBorder', border);
  el.style.setProperty('--folderTab', tab);
}

// ===== 필터 상태 =====
const MAX_ING_SELECTED = 3;
const filterState = {
  rice: new Set(),     // 'white' | 'brown'
  ings: new Set(),     // 최대 3개
  applied: false,
  onlyWithRice: false 
};

// 기존 ING 사전(id->한국어 라벨) 그대로 사용
// const ING = [...];

function updateFilterBadge(){
  const btn = document.getElementById('filterToggle');
  if(!btn) return;
  if(filterState.applied && (filterState.rice.size || filterState.ings.size)){
    btn.textContent = '필터 적용됨';
    btn.setAttribute('aria-pressed', 'true');
  }else{
    btn.textContent = '필터 적용하기';
    btn.setAttribute('aria-pressed', 'false');
  }
}

function matchesFilter(rec){
  const rice = normRice(rec.rice || null);
  const have = new Set((rec.ingredients || []).map(normIng).filter(Boolean));

  if (filterState.onlyWithRice && !rice) return false;

  // 밥 필터: 선택되어 있다면 일치해야 함
  if (filterState.rice.size){
    // filterState.rice는 토글로 0 또는 1개만 존재
    const want = Array.from(filterState.rice)[0];
    if (normRice(want) !== rice) return false;
  }

  // 속재료 필터: 선택된 모든 재료가 포함(AND)
  for (const need of filterState.ings){
    const n = normIng(need);
    if (!n || !have.has(n)) return false;
  }

  return true;
}

// 저장/필터에서 쓰는 표준 id만 허용
const VALID_INGS = new Set(['egg', 'lotus', 'carrot', 'crab', 'sausage', 'cucumber', 'bulgogi', 'fishcake', 'pickled']);
const VALID_RICE = new Set(['white','brown']);

function normIng(id){
  // 우발적으로 한글 라벨이 들어왔을 때 방어
const map = {
  '계란말이': 'egg',
  '연근': 'lotus',
  '당근': 'carrot',
  '게맛살': 'crab',
  '소시지': 'sausage',
  '오이': 'cucumber',
  '불고기': 'bulgogi',
  '어묵': 'fishcake',
  '단무지': 'pickled'
};

  const v = map[id] || id;
  return VALID_INGS.has(v) ? v : null;
}
function normRice(v){
  return VALID_RICE.has(v) ? v : null;
}

function getColorByIndex(i) {
  const colors = ["#a3d9a5", "#f7c59f", "#f6a5c0", "#b5d5ff", "#ffe29f"];
  return colors[i % colors.length];
}
