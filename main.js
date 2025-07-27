const map = L.map('map').setView([34.678, 135.160], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markers = [];

const selectedFilters = {
  genre: [],
  scene: [],
  seat: [],
  course: [],
  alcohol: [] 
};

const keywordInput = document.getElementById('keyword');
const filterToggle = document.getElementById('filter-toggle');
const filterPanel = document.getElementById('filter-panel');
const clearFiltersBtn = document.getElementById('clear-filters');
const autoCompleteList = document.getElementById('autocomplete-list');

// カスタムアイコンをジャンルごとに設定
const icons = {
  default: L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  }),
  // 他のジャンル用アイコンがあればここに追加（今回使わない）
};

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


document.querySelectorAll('#filter-panel input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', updateSelectedFiltersAndRefresh);
});

keywordInput.addEventListener('input', () => {
  const val = keywordInput.value.trim().toLowerCase();
  if (val.length === 0) {
    autoCompleteList.style.display = 'none';
    updateMarkers();
    return;
  }
  const matches = shops.filter(shop =>
    shop.name.toLowerCase().includes(val) || shop.address.toLowerCase().includes(val)
  ).slice(0, 10);

  autoCompleteList.innerHTML = '';
  if (matches.length === 0) {
    autoCompleteList.style.display = 'none';
    updateMarkers();
    return;
  }
  matches.forEach(shop => {
    const li = document.createElement('li');
    li.textContent = shop.name + ' - ' + shop.address;
    li.addEventListener('mousedown', () => {
      keywordInput.value = shop.name;
      autoCompleteList.style.display = 'none';
      updateMarkers();
    });
    autoCompleteList.appendChild(li);
  });
  autoCompleteList.style.display = 'block';
});

document.addEventListener('click', e => {
  if (!keywordInput.contains(e.target) && !autoCompleteList.contains(e.target)) {
    autoCompleteList.style.display = 'none';
  }
});

keywordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    autoCompleteList.style.display = 'none';
    updateMarkers();
  }
});

clearFiltersBtn.addEventListener('click', () => {
  document.querySelectorAll('#filter-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
  selectedFilters.genre = [];
  selectedFilters.scene = [];
  selectedFilters.seat = [];
  selectedFilters.course = [];
  selectedFilters.alcohol = [];
  keywordInput.value = '';
  autoCompleteList.style.display = 'none';
  updateMarkers();
});

updateMarkers();

// 親チェックボックスですべてON/OFF
// ▼▼▼ 親項目クリックで折りたたみ＋一括選択 ▼▼▼
document.querySelectorAll('.parent-toggle').forEach(toggle => {
  const group = toggle.dataset.group;
  const parent = toggle.closest('.filter-parent');

  toggle.addEventListener('click', (e) => {
    parent.classList.toggle('open');
  });

  // 親チェックで子も一括選択
  const parentCheckbox = toggle.querySelector('input.parent-checkbox');
  parentCheckbox.addEventListener('change', () => {
    const children = document.querySelectorAll(`.filter-children[data-group="${group}"] input[type="checkbox"]`);
    children.forEach(child => child.checked = parentCheckbox.checked);

    // indeterminate 状態リセット
    parentCheckbox.indeterminate = false;

    updateSelectedFiltersAndRefresh();
  });
});


function normalizeArrayField(field) {
  if (!field) return [];
  return Array.isArray(field) ? field : [field];
}

function updateMarkers() {
  const shopListDiv = document.getElementById('shop-list');
  shopListDiv.innerHTML = ''; // 検索結果リストをリセット

  const keyword = keywordInput.value.trim().toLowerCase();

  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  
  const sortedShops = [...shops].sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  sortedShops.forEach(shop => {
    const shopGenre = normalizeArrayField(shop.genre);
    const shopScene = normalizeArrayField(shop.scene);
    const shopSeat = normalizeArrayField(shop.seat);
    const shopCourse = normalizeArrayField(shop.course);
    const shopAlcohol = normalizeArrayField(shop.alcohol);

    const matchesGenre = selectedFilters.genre.length === 0 || selectedFilters.genre.some(f => shopGenre.includes(f));
    const matchesscene = selectedFilters.scene.length === 0 || selectedFilters.scene.some(f => shopScene.includes(f));
    const matchesseat = selectedFilters.seat.length === 0 || selectedFilters.seat.some(f => shopSeat.includes(f));
    const matchescourse = selectedFilters.course.length === 0 || selectedFilters.course.some(f => shopCourse.includes(f));
    const matchesAlcohol = selectedFilters.alcohol.length === 0 || selectedFilters.alcohol.some(f => shopAlcohol.includes(f));

    const matchesKeyword =
      keyword === '' ||
      shop.name.toLowerCase().includes(keyword) ||
      shop.address.toLowerCase().includes(keyword);

    if (matchesGenre && matchesscene && matchesseat && matchescourse && matchesAlcohol && matchesKeyword) {
      const popupContent = `
        <div style="text-align:center; max-width: 200px;">
          <strong>${shop.name}</strong><br>
          ${shop.address}<br>
          <a href="${shop.url}" target="_blank" style="color: blue;">
            お店のページを見る
          </a>
        </div>
      `;
      const icon = icons["default"];
      const marker = L.marker([shop.lat, shop.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent);
      markers.push(marker);

      // カード作成
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <strong>${shop.name}</strong><br>
        <span style="font-size:13px;">${shop.address}</span><br>
        <a href="${shop.url}" target="_blank">詳細を見る</a>
      `;
      card.addEventListener('click', () => {
        map.setView([shop.lat, shop.lng], 17);
        marker.openPopup();
      });

      shopListDiv.appendChild(card);

    }
  });
}

function updateSelectedFiltersAndRefresh() {
  const allCheckboxes = document.querySelectorAll('input[data-category]');

  ["genre", "scene", "seat", "course", "alcohol"].forEach(category => {
    selectedFilters[category] = Array.from(allCheckboxes)
      .filter(cb => cb.dataset.category === category && cb.checked)
      .map(cb => cb.value);
  });
  updateMarkers();
}

document.querySelectorAll('.filter-children input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    const group = cb.closest('.filter-children').dataset.group;
    const parentCheckbox = document.querySelector(`.parent-checkbox[data-group="${group}"]`);
    const children = document.querySelectorAll(`.filter-children[data-group="${group}"] input[type="checkbox"]`);

    const allChecked = Array.from(children).every(ch => ch.checked);
    const noneChecked = Array.from(children).every(ch => !ch.checked);

    if (allChecked) {
      parentCheckbox.checked = true;
      parentCheckbox.indeterminate = false;
    } else if (noneChecked) {
      parentCheckbox.checked = false;
      parentCheckbox.indeterminate = false;
    } else {
      parentCheckbox.checked = false;
      parentCheckbox.indeterminate = true;
    }

    updateSelectedFiltersAndRefresh();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("usage-modal");
  const closeButton = document.getElementById("close-usage-modal");
  const dontShowCheckbox = document.getElementById("dont-show-again");

  const hideUntilStr = localStorage.getItem("hideGuideUntil");

  // ▶ 読み込み時：非表示期限を確認
  if (hideUntilStr) {
    const now = new Date();
    const hideUntil = new Date(hideUntilStr);

    if (now < hideUntil) {
      modal.style.display = "none";
    } else {
      // 期限が過ぎていたら削除して再表示
      localStorage.removeItem("hideGuideUntil");
      modal.style.display = "flex";
    }
  } else {
    modal.style.display = "flex";
  }

  // ▶ 閉じるボタン
  closeButton.addEventListener("click", () => {
    if (dontShowCheckbox.checked) {
      const hideUntil = new Date();
      hideUntil.setMonth(hideUntil.getMonth() + 1); // ← 1ヶ月後
      localStorage.setItem("hideGuideUntil", hideUntil.toISOString());
    }
    modal.style.display = "none";
  });
});

document.getElementById('clear-keyword').addEventListener('click', () => {
  keywordInput.value = '';
  autoCompleteList.style.display = 'none';
  updateMarkers();
});
