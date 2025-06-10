const map = L.map('map').setView([34.678, 135.160], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markers = [];
let shopsData = [];

const selectedFilters = {
  genre: [],
  mood: [],
  people: []
};

const keywordInput = document.getElementById('keyword');
const filterToggle = document.getElementById('filter-toggle');
const filterPanel = document.getElementById('filter-panel');
const clearFiltersBtn = document.getElementById('clear-filters');
const autoCompleteList = document.getElementById('autocomplete-list');

// カスタムアイコンをジャンルごとに設定
const icons = {
  "カフェ": L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2919/2919600.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  "レストラン": L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  "バー": L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  "default": L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  })
};

// フィルターパネルの開閉アニメーション
filterToggle.addEventListener('click', () => {
  if (filterPanel.style.maxHeight && filterPanel.style.maxHeight !== '0px') {
    filterPanel.style.maxHeight = '0';
    filterPanel.style.opacity = '0';
    filterPanel.style.pointerEvents = 'none';
  } else {
    filterPanel.style.maxHeight = filterPanel.scrollHeight + 'px';
    filterPanel.style.opacity = '1';
    filterPanel.style.pointerEvents = 'auto';
  }
});

// チェックボックスの状態変化でフィルター更新
document.querySelectorAll('#filter-panel input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    selectedFilters.genre = Array.from(document.querySelectorAll('input[data-category="genre"]:checked')).map(cb => cb.value);
    selectedFilters.mood = Array.from(document.querySelectorAll('input[data-category="mood"]:checked')).map(cb => cb.value);
    selectedFilters.people = Array.from(document.querySelectorAll('input[data-category="people"]:checked')).map(cb => cb.value);

    updateMarkers();
  });
});

// キーワード検索入力時のオートコンプリート処理
keywordInput.addEventListener('input', () => {
  const val = keywordInput.value.trim().toLowerCase();
  if (val.length === 0) {
    autoCompleteList.style.display = 'none';
    updateMarkers();
    return;
  }
  // shopsDataからnameかaddressがvalに含まれる候補を抽出（最大10件）
  const matches = shopsData.filter(shop =>
    shop.name.toLowerCase().includes(val) || shop.address.toLowerCase().includes(val)
  ).slice(0, 10);

  // 候補リストの更新
  autoCompleteList.innerHTML = '';
  if (matches.length === 0) {
    autoCompleteList.style.display = 'none';
    updateMarkers();
    return;
  }
  matches.forEach(shop => {
    const li = document.createElement('li');
    li.textContent = shop.name + ' - ' + shop.address;
    li.addEventListener('mousedown', () => { // mousedownで選択反映（clickはblurで消えるので）
      keywordInput.value = shop.name;
      autoCompleteList.style.display = 'none';
      updateMarkers();
    });
    autoCompleteList.appendChild(li);
  });
  autoCompleteList.style.display = 'block';
});

// キーワード入力以外の場所クリックでオートコンプリート非表示
document.addEventListener('click', e => {
  if (!keywordInput.contains(e.target) && !autoCompleteList.contains(e.target)) {
    autoCompleteList.style.display = 'none';
  }
});

// キーワード入力の変更でマーカー更新
keywordInput.addEventListener('input', updateMarkers);

// クリアボタンで全フィルターとキーワードを解除
clearFiltersBtn.addEventListener('click', () => {
  // チェックをすべて外す
  document.querySelectorAll('#filter-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
  selectedFilters.genre = [];
  selectedFilters.mood = [];
  selectedFilters.people = [];

  // キーワードクリア
  keywordInput.value = '';
  autoCompleteList.style.display = 'none';

  updateMarkers();
});

// 店舗データの読み込み
fetch('shops.json')
  .then(res => res.json())
  .then(data => {
    shopsData = data;
    updateMarkers();
  });

// マーカーの更新
function updateMarkers() {
  const keyword = keywordInput.value.trim().toLowerCase();

  // 既存のマーカーを削除
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  shopsData.forEach(shop => {
    // フィルター判定（複数選択に対応）
    const matchesGenre = selectedFilters.genre.length === 0 || selectedFilters.genre.includes(shop.genre);
    const matchesMood = selectedFilters.mood.length === 0 || selectedFilters.mood.includes(shop.mood);
    const matchesPeople = selectedFilters.people.length === 0 || selectedFilters.people.includes(shop.people);

    // キーワード部分一致判定（名前か住所）
    const matchesKeyword =
      keyword === '' ||
      shop.name.toLowerCase().includes(keyword) ||
      shop.address.toLowerCase().includes(keyword);

    if (matchesGenre && matchesMood && matchesPeople && matchesKeyword) {
      const popupContent = `
        <div style="text-align:center; max-width: 200px;">
          <strong>${shop.name}</strong><br>
          ${shop.address}<br>
          <a href="${shop.url}" target="_blank" style="color: blue;">
            お店のページを見る
          </a>
        </div>
      `;

      const icon = icons[shop.genre] || icons["default"];
      const marker = L.marker([shop.lat, shop.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent);

      markers.push(marker);
    }
  });
}
