(function() {
  // ==================== IndexedDB 工具 ====================
  const DB_NAME = 'CharacterDiyDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'media';

  function openDB() {
      return new Promise((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, DB_VERSION);
          request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(STORE_NAME)) {
                  db.createObjectStore(STORE_NAME);
              }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
  }

  async function saveToDB(key, value) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(value, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }

  async function loadFromDB(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
  }

  async function removeFromDB(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.delete(key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }

  // ---------- 1. PVE/PVP 模式切换 UI + 数据同步 ----------
  const circles = document.querySelectorAll('.circle');
  const indicator = document.querySelector('.active-indicator');
  const container = document.querySelector('.skill-tabs-list');
  let currentSkillMode = 'pve';
  
  function setSkillModeUI(mode) {
    circles.forEach(c => {
      if (c.dataset.mode === mode) c.classList.add('active');
      else c.classList.remove('active');
    });
    if (indicator) {
      const activeCircle = document.querySelector('.circle.active');
      if (activeCircle) {
        const circleWidth = circles[0].offsetWidth;
        const gap = parseInt(getComputedStyle(container).gap) || 0;
        const index = Array.from(circles).indexOf(activeCircle);
        indicator.style.transform = `translateX(${index * (circleWidth + gap)}px)`;
      }
    }
  }
  
  if (circles.length && indicator && container) {
    circles.forEach((circle, index) => {
      circle.addEventListener('click', function() {
        if (this.classList.contains('active')) return;
        const newMode = this.dataset.mode;
        circles.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        indicator.style.transform = `translateX(${index * (circles[0].offsetWidth + parseInt(getComputedStyle(container).gap))}px)`;
        currentSkillMode = newMode;
        syncEditAreaToMode();
        updatePreview();
      });
    });
  }
  
  function syncEditAreaToMode() {
    if (currentSkillMode === 'pve') {
      document.getElementById('input-active-name').innerText = charData.pveActiveName;
      document.getElementById('input-cd-time').innerText = charData.cdTime;
      document.getElementById('input-active-desc').innerText = charData.pveActiveDesc;
      document.getElementById('input-passive-name').innerText = charData.pvePassiveName;
      document.getElementById('input-passive-desc').innerText = charData.pvePassiveDesc;
    } else {
      document.getElementById('input-active-name').innerText = charData.pvpActiveName;
      document.getElementById('input-cd-time').innerText = charData.cdTime;
      document.getElementById('input-active-desc').innerText = charData.pvpActiveDesc;
      document.getElementById('input-passive-name').innerText = charData.pvpPassiveName;
      document.getElementById('input-passive-desc').innerText = charData.pvpPassiveDesc;
    }
  }

  function syncEditControls() {
    document.getElementById('input-char-name').innerText = charData.charName;
    document.getElementById('input-archive-fullname').innerText = charData.fullName || '';
    document.getElementById('input-char-title').innerText = charData.charTitle;
    document.getElementById('input-stat-atk').innerText = charData.statAtk;
    document.getElementById('input-stat-def').innerText = charData.statDef;
    document.getElementById('input-stat-hp').innerText = charData.statHp;
    document.getElementById('input-level-number').value = charData.levelNumber;
    document.getElementById('input-intimacy-level').value = charData.intimacyLevel;
    document.getElementById('input-potential-desc').innerText = charData.potentialDesc;
    const activeStateSwitch = document.getElementById('active-state-switch');
    if (charData.activeState) {
      activeStateSwitch.classList.add('active');
    } else {
      activeStateSwitch.classList.remove('active');
    }
    document.getElementById('material-select').value = charData.material;
    document.getElementById('material-select-group').style.display = 
      (charData.enablePotential && !charData.activeState) ? 'flex' : 'none';
    document.getElementById('input-archive-birthday').innerText = charData.archiveBirthday;
    document.getElementById('input-archive-likefood').innerText = charData.archiveLikeFood;
    document.getElementById('input-archive-desc').innerText = charData.archiveDesc;
    const potentialSwitch = document.getElementById('potential-switch');
    if (charData.enablePotential) {
      potentialSwitch.classList.add('active');
    } else {
      potentialSwitch.classList.remove('active');
    }
    const clickPreviewSwitch = document.getElementById('clickpreview-switch');
    if (charData.enableClickPreview) {
      clickPreviewSwitch.classList.add('active');
    } else {
      clickPreviewSwitch.classList.remove('active');
    }
    const skillModeSwitch = document.getElementById('skill-mode-switch');
    if (charData.enableSkillMode) {
      skillModeSwitch.classList.add('active');
    } else {
      skillModeSwitch.classList.remove('active');
    }
  }
  
  function saveCurrentSkillData() {
    const activeName = document.getElementById('input-active-name')?.innerText.trim();
    const activeDesc = document.getElementById('input-active-desc')?.innerText.trim();
    const passiveName = document.getElementById('input-passive-name')?.innerText.trim();
    const passiveDesc = document.getElementById('input-passive-desc')?.innerText.trim();
    const cdTime = document.getElementById('input-cd-time')?.innerText.trim();
    
    if (currentSkillMode === 'pve') {
      charData.pveActiveName = activeName || charData.pveActiveName;
      charData.pveActiveDesc = activeDesc || charData.pveActiveDesc;
      charData.pvePassiveName = passiveName || charData.pvePassiveName;
      charData.pvePassiveDesc = passiveDesc || charData.pvePassiveDesc;
    } else {
      charData.pvpActiveName = activeName || charData.pvpActiveName;
      charData.pvpActiveDesc = activeDesc || charData.pvpActiveDesc;
      charData.pvpPassiveName = passiveName || charData.pvpPassiveName;
      charData.pvpPassiveDesc = passiveDesc || charData.pvpPassiveDesc;
    }
    if (cdTime !== undefined) charData.cdTime = cdTime;
  }

  // ---------- 2. 全局变量与图片拖拽缩放逻辑 ----------
  const containerDiv = document.getElementById('character-diy-container');
  if (!containerDiv) return;

  let img = document.getElementById('preview-avatar');
  let isDragging = false;
  let startX, startY;
  let translateX = 0, translateY = 0, scale = 1;

  function resetImageTransform() {
    translateX = 0; translateY = 0; scale = 1;
    if (img) img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }
  
  function initImageInteractions() {
    if (!img) return;
    img.style.cursor = 'grab';
    img.style.touchAction = 'none';
    img.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    img.addEventListener('wheel', onWheel, { passive: false });
    img.addEventListener('dragstart', (e) => e.preventDefault());
    img.addEventListener('touchstart', onTouchStart);
    img.addEventListener('touchmove', onTouchMove);
    img.addEventListener('touchend', onTouchEnd);
  }
  
  function onMouseDown(e) {
    e.preventDefault();
    isDragging = true;
    img.style.cursor = 'grabbing';
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
  }
  
  function onMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
  }
  
  function onMouseUp(e) {
    if (isDragging) {
      isDragging = false;
      img.style.cursor = 'grab';
    }
  }
  
  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    let newScale = scale + delta;
    newScale = Math.min(3, Math.max(0.3, newScale));
    scale = newScale;
    updateTransform();
  }
  
  function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      isDragging = true;
      const touch = e.touches[0];
      startX = touch.clientX - translateX;
      startY = touch.clientY - translateY;
    }
  }
  
  function onTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      translateX = touch.clientX - startX;
      translateY = touch.clientY - startY;
      updateTransform();
    }
  }
  
  function onTouchEnd(e) {
    isDragging = false;
  }
  
  function updateTransform() {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  // ---------- 3. 辅助函数 ----------
  function escapeHtml(unsafe) {
    return unsafe.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
  
  function parseColorText(text) {
    if (!text) return '';
    let temp = text.replace(/&nbsp;/g, '{{nbsp}}').replace(/&emsp;/g, '{{emsp}}').replace(/&ensp;/g, '{{ensp}}');
    const regex = /\{\{#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\|([^}]+)\}\}/g;
    let result = '';
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(temp)) !== null) {
      result += escapeHtml(temp.substring(lastIndex, match.index));
      const color = '#' + match[1];
      const content = escapeHtml(match[2]);
      result += `<span style="color: ${color};">${content}</span>`;
      lastIndex = regex.lastIndex;
    }
    result += escapeHtml(temp.substring(lastIndex));
    result = result.replace(/{{nbsp}}/g, '&nbsp;').replace(/{{emsp}}/g, '&emsp;').replace(/{{ensp}}/g, '&ensp;');
    result = result.replace(/\n/g, '<br>');
    return result;
  }

  // ---------- 4. 材料图片映射 ----------
  const materialImages = {
    yangyan: 'https://patchwiki.biligame.com/images/starengine/6/6c/2qj7axide90ao9sh6dk8g3kxg1yccg4.png',
    yueguang: 'https://patchwiki.biligame.com/images/starengine/c/ce/bc7btapqpzb9vtpvopa91544v56ab13.png',
    shanluan: 'https://patchwiki.biligame.com/images/starengine/7/7f/1ba69zpsf35pw84ct91p8mnovnjwpnc.png',
    bingyuan: 'https://patchwiki.biligame.com/images/starengine/d/d4/ldzfh87q42bt8vj99s4apap1rbum9zt.png',
    daqi: 'https://patchwiki.biligame.com/images/starengine/a/ab/g0yci7vecx4rpo52txo6bc7w3akmqme.png',
    chuanhe: 'https://patchwiki.biligame.com/images/starengine/1/15/1w26df0q350id78qhg13o6nabmfra8f.png',
    rongyan: 'https://patchwiki.biligame.com/images/starengine/a/a0/1yuhqdwos98p59pndxtu33qanxsoak6.png',
    yinying: 'https://patchwiki.biligame.com/images/starengine/b/b1/27k2yll9gufyqqrf9krlhrsoshey8kt.png'
  };

  // ---------- 5. 角色数据模型（图片默认值保留远程 URL）----------
  let charData = {
    charName: '米米',
    fullName: '',
    charTitle: '看板娘',
    tagSkill: '技能',
    tagUpgrade: '升级',
    tagPotential: '潜能',
    tagArchive: '档案',
    statAtk: 1, statDef: 1, statHp: 9,
    levelNumber: 5,
    enablePotential: false,
    potentialText: '潜能激发',
    pveActiveName: '商品补货',
    pveActiveDesc: '丢弃全部手牌，随后获得原手牌数量{{#ff4646|+1}}张卡牌。',
    cdTime: '3',
    pvePassiveName: '过期回收',
    pvePassiveDesc: '每丢弃1张战斗牌，获得1星币。',
    pvpActiveName: '',
    pvpActiveDesc: '',
    pvpPassiveName: '',
    pvpPassiveDesc: '',
    intimacyLevel: 3,
    avatarUrl: 'https://patchwiki.biligame.com/images/starengine/e/e3/sqjeojqr22j322mp104zwhwztfvdrei.png',
    bgUrl: 'https://patchwiki.biligame.com/images/starengine/5/57/nfdf4valfnmo6cykwhgxswkgpg0nbcb.png',
    enableClickPreview: false,
    enableSkillMode: false,
    potentialDesc: '每累计获得25张卡牌，获得1个筹码。',
    activeState: true,
    material: 'yangyan',
    skillIconUrl: 'https://patchwiki.biligame.com/images/starengine/9/9a/cshh2jxyoo2lmldzobwbf6h3bnm7qb0.png',
    archiveBirthday: '8月2日',
    archiveLikeFood: '精致的便当盒',
    archiveDesc: '&emsp;&emsp;游戏《吉星派对》的全能看板娘，超级打工战士。便利店、酒吧、超市都有米米打工的身影，恋第一次见到米米就是在便利店。至于米米为什么会成为《吉星派对》游戏的看板娘就不得而知了。\n&emsp;&emsp;米米神出鬼没，可能会出现在各种打工场合，除了某些直播工作的时候形象没有任何变化。'
  };

  // ---------- 6. 异步加载数据（从 localStorage + IndexedDB）----------
  async function loadAllData() {
    // 1. 从 localStorage 加载文本
    try {
      const saved = localStorage.getItem('characterDIY_final5');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 排除可能遗留的图片字段，防止覆盖
        const { avatarUrl: _, skillIconUrl: __, bgUrl: ___, ...textData } = parsed;
        charData = { ...charData, ...textData };
      }
    } catch(e) { console.warn('读取文本数据失败', e); }

    // 2. 从 IndexedDB 加载立绘
    try {
      const savedAvatar = await loadFromDB('avatarUrl');
      if (savedAvatar) charData.avatarUrl = savedAvatar;
    } catch(e) { console.warn('读取立绘失败', e); }

    // 3. 从 IndexedDB 加载技能图标
    try {
      const savedSkillIcon = await loadFromDB('skillIconUrl');
      if (savedSkillIcon) charData.skillIconUrl = savedSkillIcon;
    } catch(e) { console.warn('读取技能图标失败', e); }

    // 初始化渲染
    img = document.getElementById('preview-avatar');
    initImageInteractions();
    setSkillModeUI(currentSkillMode);
    updatePreview(true);
    updateEditAreaVisibility();
  }

  // ---------- 7. 保存数据（异步，文本进 localStorage，图片进 IndexedDB）----------
  async function saveData() {
    // 分离图片字段
    const { avatarUrl, skillIconUrl, bgUrl, ...textData } = charData;
    // 文本存入 localStorage
    try {
      localStorage.setItem('characterDIY_final5', JSON.stringify(textData));
    } catch(e) { console.warn('保存文本数据失败', e); }

    // 图片异步写入 IndexedDB（仅当为 Base64 时）
    if (avatarUrl && avatarUrl.startsWith('data:')) {
      await saveToDB('avatarUrl', avatarUrl).catch(e => console.warn('保存立绘失败', e));
    }
    if (skillIconUrl && skillIconUrl.startsWith('data:')) {
      await saveToDB('skillIconUrl', skillIconUrl).catch(e => console.warn('保存技能图标失败', e));
    }
  }

  // ---------- PNG 元数据工具 ----------
  function stringToBytes(str) {
    return new TextEncoder().encode(str);
  }
  function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
  }
  function readUint32(bytes, offset) {
    return (bytes[offset] << 24) | (bytes[offset+1] << 16) | (bytes[offset+2] << 8) | bytes[offset+3];
  }
  function writeUint32(bytes, offset, value) {
    bytes[offset] = (value >> 24) & 0xFF;
    bytes[offset+1] = (value >> 16) & 0xFF;
    bytes[offset+2] = (value >> 8) & 0xFF;
    bytes[offset+3] = value & 0xFF;
  }
  function crc32(data, start, length) {
    let crc = 0xFFFFFFFF;
    for (let i = start; i < start + length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        if (crc & 1) crc = (crc >>> 1) ^ 0xEDB88320;
        else crc = crc >>> 1;
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function embedDataToPNG(originalPngBlob, jsonStr, callback) {
    const reader = new FileReader();
    reader.onload = function() {
      const buffer = new Uint8Array(reader.result);
      const signature = [137, 80, 78, 71, 13, 10, 26, 10];
      for (let i = 0; i < 8; i++) {
        if (buffer[i] !== signature[i]) { callback(null); return; }
      }
      const keyword = 'starengine';
      const keyBytes = stringToBytes(keyword);
      const textBytes = stringToBytes(jsonStr);
      const chunkData = new Uint8Array(keyBytes.length + 1 + textBytes.length);
      chunkData.set(keyBytes);
      chunkData[keyBytes.length] = 0;
      chunkData.set(textBytes, keyBytes.length + 1);
      const typeBytes = stringToBytes('tEXt');
      const crcInput = new Uint8Array(4 + chunkData.length);
      crcInput.set(typeBytes);
      crcInput.set(chunkData, 4);
      const computedCrc = crc32(crcInput, 0, crcInput.length);

      const iendSignature = [73, 69, 78, 68];
      let iendPos = -1;
      for (let i = 0; i < buffer.length - 3; i++) {
        if (buffer[i]===73 && buffer[i+1]===69 && buffer[i+2]===78 && buffer[i+3]===68) {
          iendPos = i - 4; break;
        }
      }
      if (iendPos === -1) { callback(null); return; }

      const newPngSize = iendPos + 12 + chunkData.length + 12;
      const newPng = new Uint8Array(newPngSize);
      newPng.set(buffer.slice(0, iendPos));
      writeUint32(newPng, iendPos, chunkData.length);
      newPng.set(typeBytes, iendPos + 4);
      newPng.set(chunkData, iendPos + 8);
      writeUint32(newPng, iendPos + 8 + chunkData.length, computedCrc);
      newPng.set(buffer.slice(iendPos, iendPos + 12), iendPos + 12 + chunkData.length);
      callback(new Blob([newPng], { type: 'image/png' }));
    };
    reader.readAsArrayBuffer(originalPngBlob);
  }
  function extractDataFromPNG(file, callback) {
    const reader = new FileReader();
    reader.onload = function() {
      const buffer = new Uint8Array(reader.result);
      let offset = 8;
      while (offset < buffer.length - 8) {
        const length = readUint32(buffer, offset);
        const type = bytesToString(buffer.slice(offset + 4, offset + 8));
        if (type === 'tEXt') {
          const chunkData = buffer.slice(offset + 8, offset + 8 + length);
          let nullPos = 0;
          while (nullPos < chunkData.length && chunkData[nullPos] !== 0) nullPos++;
          if (nullPos < chunkData.length) {
            const textBytes = chunkData.slice(nullPos + 1);
            callback(bytesToString(textBytes));
            return;
          }
        }
        offset += 12 + length;
      }
      callback(null);
    };
    reader.readAsArrayBuffer(file);
  }

  // ---------- 8. 面板切换逻辑 ----------
  const potentialTag = document.getElementById('preview-tag-potential-container');
  const archiveTag = document.getElementById('preview-tag-archive-container');
  const defaultPanel = document.querySelector('.default-panel');
  const potentialPanel = document.querySelector('.potential-panel');
  const archivePanel = document.querySelector('.archive-panel');
  const skillTag = document.querySelector('.skill-tag');
  const upgradeTag = document.querySelector('.upgrade-tag');
  
  let potentialPanelActive = false;
  let archivePanelActive = false;
  let skillModeForcedHidden = false;

  function updateEditAreaVisibility() {
    const skillArea = document.getElementById('skill-edit-area');
    const potentialArea = document.getElementById('potential-edit-area');
    const archiveArea = document.getElementById('archive-edit-area');
    
    if (potentialPanelActive) {
      skillArea.style.display = 'none';
      archiveArea.style.display = 'none';
      potentialArea.style.display = 'block';
    } else if (archivePanelActive) {
      skillArea.style.display = 'none';
      potentialArea.style.display = 'none';
      archiveArea.style.display = 'block';
    } else {
      skillArea.style.display = 'block';
      potentialArea.style.display = 'none';
      archiveArea.style.display = 'none';
    }
  }

  function updateTagColors() {
    if (potentialPanelActive && charData.enablePotential) {
      potentialTag.classList.add('potential-active');
      potentialTag.classList.remove('force-pink');
      [skillTag, upgradeTag, archiveTag].forEach(tag => { if (tag) tag.classList.add('force-pink'); });
    } else if (archivePanelActive) {
      archiveTag.classList.add('archive-active');
      archiveTag.classList.remove('force-pink');
      [skillTag, upgradeTag, potentialTag].forEach(tag => { if (tag) tag.classList.add('force-pink'); });
    } else {
      potentialTag.classList.remove('potential-active');
      archiveTag.classList.remove('archive-active');
      [skillTag, upgradeTag, potentialTag, archiveTag].forEach(tag => { if (tag) tag.classList.remove('force-pink'); });
    }
  }

  function forceHideSkillMode() {
    const skillModePreview = document.getElementById('skill-mode-preview');
    if (skillModePreview) {
      skillModePreview.style.display = 'none';
      skillModeForcedHidden = true;
    }
  }
  
  function restoreSkillMode() {
    const skillModePreview = document.getElementById('skill-mode-preview');
    if (skillModePreview && charData.enableSkillMode) {
      skillModePreview.style.display = 'block';
    }
    skillModeForcedHidden = false;
  }

  function togglePotentialPanel() {
    if (!charData.enablePotential) return;
    if (archivePanelActive) {
      archivePanelActive = false;
      archivePanel.style.display = 'none';
    }
    potentialPanelActive = !potentialPanelActive;
    if (potentialPanelActive) {
      saveCurrentSkillData();
      forceHideSkillMode();
      defaultPanel.style.display = 'none';
      potentialPanel.style.display = 'flex';
      archivePanel.style.display = 'none';
    } else {
      restoreSkillMode();
      defaultPanel.style.display = 'block';
      potentialPanel.style.display = 'none';
    }
    updateTagColors();
    updateEditAreaVisibility();
  }

  function toggleArchivePanel() {
    if (potentialPanelActive) {
      potentialPanelActive = false;
      potentialPanel.style.display = 'none';
    }
    archivePanelActive = !archivePanelActive;
    if (archivePanelActive) {
      saveCurrentSkillData();
      forceHideSkillMode();
      defaultPanel.style.display = 'none';
      archivePanel.style.display = 'flex';
      potentialPanel.style.display = 'none';
    } else {
      restoreSkillMode();
      defaultPanel.style.display = 'block';
      archivePanel.style.display = 'none';
    }
    updateTagColors();
    updateEditAreaVisibility();
  }

  if (potentialTag) {
    potentialTag.style.cursor = 'pointer';
    potentialTag.addEventListener('click', (e) => {
      e.stopPropagation();
      if (charData.enablePotential) togglePotentialPanel();
    });
  }
  
  if (archiveTag) {
    archiveTag.style.cursor = 'pointer';
    archiveTag.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleArchivePanel();
    });
  }
  
  if (skillTag) {
    skillTag.style.cursor = 'pointer';
    skillTag.addEventListener('click', (e) => {
      e.stopPropagation();
      if (potentialPanelActive) {
        potentialPanelActive = false;
        potentialPanel.style.display = 'none';
      }
      if (archivePanelActive) {
        archivePanelActive = false;
        archivePanel.style.display = 'none';
      }
      defaultPanel.style.display = 'block';
      updateTagColors();
      updateEditAreaVisibility();
      restoreSkillMode();
    });
  }
  
  if (upgradeTag) {
    upgradeTag.style.cursor = 'pointer';
    upgradeTag.addEventListener('click', (e) => {
      e.stopPropagation();
      if (potentialPanelActive) {
        potentialPanelActive = false;
        potentialPanel.style.display = 'none';
      }
      if (archivePanelActive) {
        archivePanelActive = false;
        archivePanel.style.display = 'none';
      }
      defaultPanel.style.display = 'block';
      updateTagColors();
      updateEditAreaVisibility();
      restoreSkillMode();
    });
  }

  // ---------- 9. 核心预览更新函数 ----------
  function updatePreview(isInit = false) {
    if (!isInit) saveCurrentSkillData();
    
    document.getElementById('preview-left-name1').innerText = charData.charTitle;
    document.getElementById('preview-left-name2').innerText = charData.charName;
    document.getElementById('preview-right-name').innerText = charData.charName;
    document.getElementById('preview-right-title').innerText = charData.charTitle;
    document.getElementById('preview-tag-text-skill').innerText = charData.tagSkill;
    document.getElementById('preview-tag-text-upgrade').innerText = charData.tagUpgrade;
    document.getElementById('preview-tag-text-potential').innerText = charData.tagPotential;
    document.getElementById('preview-tag-text-archive').innerText = charData.tagArchive;
    document.getElementById('preview-stat-value-atk').innerText = charData.statAtk;
    document.getElementById('preview-stat-value-def').innerText = charData.statDef;
    document.getElementById('preview-stat-value-hp').innerText = charData.statHp;
    document.getElementById('preview-level-number').innerText = charData.levelNumber;
    document.getElementById('preview-potential-text').innerText = charData.potentialText;
    
    const potTrigger = document.getElementById('preview-potential-trigger');
    if (potTrigger) potTrigger.style.display = charData.enablePotential ? 'flex' : 'none';
    if (potentialTag) potentialTag.style.display = charData.enablePotential ? 'flex' : 'none';
    
    if (!charData.enablePotential && potentialPanelActive) {
      potentialPanelActive = false;
      defaultPanel.style.display = 'block';
      potentialPanel.style.display = 'none';
      updateTagColors();
      updateEditAreaVisibility();
    }
    
    const activeName = (currentSkillMode === 'pve') ? charData.pveActiveName : charData.pvpActiveName;
    const activeDesc = (currentSkillMode === 'pve') ? charData.pveActiveDesc : charData.pvpActiveDesc;
    const passiveName = (currentSkillMode === 'pve') ? charData.pvePassiveName : charData.pvpPassiveName;
    const passiveDesc = (currentSkillMode === 'pve') ? charData.pvePassiveDesc : charData.pvpPassiveDesc;
    
    document.getElementById('preview-active-skill-name').innerText = '主动技能：' + (activeName || '');
    document.getElementById('preview-active-desc').innerHTML = parseColorText(activeDesc);
    document.getElementById('preview-passive-skill-name').innerText = '被动技能：' + (passiveName || '');
    document.getElementById('preview-passive-desc').innerHTML = parseColorText(passiveDesc);
    document.getElementById('preview-cd-time').innerText = charData.cdTime;
    
    const heartContainers = document.querySelectorAll('.heart-container');
    heartContainers.forEach((container, index) => {
      if (index < charData.intimacyLevel) container.classList.add('filled');
      else container.classList.remove('filled');
    });
    
    const intimacyBar = document.querySelector('.intimacy-bar');
    if (intimacyBar) intimacyBar.style.backgroundColor = (charData.intimacyLevel < 5) ? 'rgba(0,0,0,0.5)' : '#e62260';
    
    const levelTexts = ['0/20', '0/120', '0/600', '0/3000', '0/6000', 'MAX'];
    document.getElementById('preview-intimacy-value').innerText = levelTexts[charData.intimacyLevel] || '0/20';
    
    const avatarImg = document.getElementById('preview-avatar');
    if (avatarImg && avatarImg.src !== charData.avatarUrl) {
      avatarImg.crossOrigin = "anonymous";
      avatarImg.src = charData.avatarUrl;
      avatarImg.onload = function() {
        if (window._pendingTransform) {
          const t = window._pendingTransform;
          translateX = t.translateX;
          translateY = t.translateY;
          scale = t.scale;
          updateTransform();
          delete window._pendingTransform;
        } else {
          resetImageTransform();
        }
      };
    }
    
    document.getElementById('preview-clickpreview').style.display = charData.enableClickPreview ? 'block' : 'none';
    
    const skillModeEl = document.getElementById('skill-mode-preview');
    if (skillModeEl) {
      if (skillModeForcedHidden) {
        skillModeEl.style.display = 'none';
      } else {
        skillModeEl.style.display = charData.enableSkillMode ? 'block' : 'none';
      }
    }
    
    document.getElementById('char-potential-name').innerText = charData.charName;
    document.querySelector('.char-potential-desc').innerHTML = parseColorText(charData.potentialDesc);
    
    const potentialNo = document.querySelector('.potential-no');
    const potentialLight = document.querySelector('.potential-light');
    if (potentialNo && potentialLight) {
      potentialNo.style.display = charData.activeState ? 'none' : 'grid';
      potentialLight.style.display = charData.activeState ? 'block' : 'none';
    }
    
    const materialImg = document.querySelector('.potential-no-items2-stuff img');
    if (materialImg) materialImg.src = materialImages[charData.material] || materialImages.yangyan;
    
    const displayFullName = charData.fullName && charData.fullName.trim() !== '' ? charData.fullName : charData.charName;
    document.getElementById('char-archive-name').innerText = charData.charName;
    document.getElementById('char-archive-title').innerText = charData.charTitle;
    document.getElementById('char-archive-desc-name').innerHTML = parseColorText(displayFullName);
    document.getElementById('char-archive-desc-birthday').innerHTML = parseColorText(charData.archiveBirthday);
    document.getElementById('char-archive-desc-likefood').innerHTML = parseColorText(charData.archiveLikeFood);
    document.getElementById('char-archive-desc-desc').innerHTML = parseColorText(charData.archiveDesc);
    
    document.getElementById('skill-tag-icon').src = charData.skillIconUrl;
    
    if (isInit) {
      const potentialSwitch = document.getElementById('potential-switch');
      if (charData.enablePotential) potentialSwitch.classList.add('active'); else potentialSwitch.classList.remove('active');
      const clickPreviewSwitch = document.getElementById('clickpreview-switch');
      if (charData.enableClickPreview) clickPreviewSwitch.classList.add('active'); else clickPreviewSwitch.classList.remove('active');
      const skillModeSwitch = document.getElementById('skill-mode-switch');
      if (charData.enableSkillMode) skillModeSwitch.classList.add('active'); else skillModeSwitch.classList.remove('active');
      
      document.getElementById('input-intimacy-level').value = charData.intimacyLevel;
      syncEditAreaToMode();
      document.getElementById('input-char-name').innerText = charData.charName;
      document.getElementById('input-archive-fullname').innerText = charData.fullName;
      document.getElementById('input-char-title').innerText = charData.charTitle;
      document.getElementById('input-stat-atk').innerText = charData.statAtk;
      document.getElementById('input-stat-def').innerText = charData.statDef;
      document.getElementById('input-stat-hp').innerText = charData.statHp;
      document.getElementById('input-level-number').value = charData.levelNumber;
      document.getElementById('input-potential-desc').innerText = charData.potentialDesc;
      document.getElementById('input-archive-birthday').innerText = charData.archiveBirthday;
      document.getElementById('input-archive-likefood').innerText = charData.archiveLikeFood;
      document.getElementById('input-archive-desc').innerText = charData.archiveDesc;
      document.getElementById('material-select').value = charData.material;
      const activeStateSwitch = document.getElementById('active-state-switch');
      if (charData.activeState) activeStateSwitch.classList.add('active'); else activeStateSwitch.classList.remove('active');
      document.getElementById('material-select-group').style.display = (charData.enablePotential && !charData.activeState) ? 'flex' : 'none';
    }
    
    (function adjustLeftName1Position() {
      const leftName1 = document.getElementById('preview-left-name1');
      if (!leftName1) return;
      function getCurrentTranslateX(el) {
        const style = window.getComputedStyle(el);
        const transform = style.transform;
        if (transform === 'none') return 0;
        const matrix = transform.match(/matrix.*\((.+)\)/);
        if (matrix) {
          const values = matrix[1].split(', ');
          if (values.length === 6) return parseFloat(values[4]) || 0;
          if (values.length === 16) return parseFloat(values[12]) || 0;
        }
        return 0;
      }
      const rawRight = leftName1.offsetLeft + leftName1.offsetWidth;
      if (window.__leftName1TargetRight === undefined) {
        const currentTx = getCurrentTranslateX(leftName1);
        window.__leftName1TargetRight = rawRight + currentTx;
      }
      const target = window.__leftName1TargetRight;
      const newTx = target - rawRight;
      leftName1.style.transform = `translateX(${newTx}px)`;
    })();

    (function adjustLeftName2Position() {
      const leftName2 = document.getElementById('preview-left-name2');
      if (!leftName2) return;
      function getCurrentTranslateX(el) {
        const style = window.getComputedStyle(el);
        const transform = style.transform;
        if (transform === 'none') return 0;
        const matrix = transform.match(/matrix.*\((.+)\)/);
        if (matrix) {
          const values = matrix[1].split(', ');
          if (values.length === 6) return parseFloat(values[4]) || 0;
          if (values.length === 16) return parseFloat(values[12]) || 0;
        }
        return 0;
      }
      const rawRight = leftName2.offsetLeft + leftName2.offsetWidth;
      if (window.__leftName2TargetRight === undefined) {
        const currentTx = getCurrentTranslateX(leftName2);
        window.__leftName2TargetRight = rawRight + currentTx;
      }
      const target = window.__leftName2TargetRight;
      const newTx = target - rawRight;
      leftName2.style.transform = `translateX(${newTx}px)`;
    })();
  }

  // ---------- 10. 编辑区输入绑定 ----------
  function bindInput(id, key, isNumber = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', async function() {
      let val = this.innerText.trim();
      if (isNumber) val = parseInt(val) || 0;
      charData[key] = val;
      await saveData();
      updatePreview(false);
    });
  }
  
  const textFields = [
    ['input-char-name', 'charName'],
    ['input-archive-fullname', 'fullName'],
  ];
  textFields.forEach(f => bindInput(f[0], f[1]));

  const titleDiv = document.getElementById('input-char-title');
  const MAX_TITLE_LENGTH = 9;
  titleDiv.addEventListener('beforeinput', function(e) {
    const currentLength = (titleDiv.innerText || '').length;
    if (
      (e.inputType === 'insertText' ||
      e.inputType === 'insertFromPaste' ||
      e.inputType === 'insertFromDrop' ||
      e.inputType === 'insertReplacementText') &&
      e.data
    ) {
      if (currentLength + e.data.length > MAX_TITLE_LENGTH) {
        e.preventDefault();
      }
    }
  });
  titleDiv.addEventListener('input', async function() {
    let text = titleDiv.innerText;
    if (text.length > MAX_TITLE_LENGTH) {
      titleDiv.innerText = text.slice(0, MAX_TITLE_LENGTH);
      const range = document.createRange();
      range.selectNodeContents(titleDiv);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    charData.charTitle = titleDiv.innerText;
    await saveData();
    updatePreview(false);
  });
  
  const numFields = [
    ['input-stat-atk', 'statAtk', true],
    ['input-stat-def', 'statDef', true],
    ['input-stat-hp', 'statHp', true]
  ];
  numFields.forEach(f => bindInput(f[0], f[1], f[2]));
  
  document.getElementById('input-level-number').addEventListener('input', async function() {
    let val = parseInt(this.value, 10);
    if (isNaN(val)) val = 0;
    val = Math.min(6, Math.max(0, val));
    this.value = val;
    charData.levelNumber = val;
    await saveData();
    updatePreview(false);
  });
  
  document.getElementById('input-intimacy-level').addEventListener('input', async function() {
    let val = parseInt(this.value, 10);
    if (isNaN(val)) val = 0;
    val = Math.min(5, Math.max(0, val));
    charData.intimacyLevel = val;
    this.value = val;
    await saveData();
    updatePreview(false);
  });
  
  function bindSkillInput(id, modeKeyFunc) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', async function() {
      const value = this.innerText.trim();
      const key = modeKeyFunc(currentSkillMode);
      charData[key] = value;
      await saveData();
      updatePreview(false);
    });
  }
  
  bindSkillInput('input-active-name', (mode) => mode === 'pve' ? 'pveActiveName' : 'pvpActiveName');
  bindSkillInput('input-cd-time', () => 'cdTime');
  bindSkillInput('input-active-desc', (mode) => mode === 'pve' ? 'pveActiveDesc' : 'pvpActiveDesc');
  bindSkillInput('input-passive-name', (mode) => mode === 'pve' ? 'pvePassiveName' : 'pvpPassiveName');
  bindSkillInput('input-passive-desc', (mode) => mode === 'pve' ? 'pvePassiveDesc' : 'pvpPassiveDesc');
  
  bindInput('input-potential-desc', 'potentialDesc');
  bindInput('input-archive-birthday', 'archiveBirthday');
  bindInput('input-archive-likefood', 'archiveLikeFood');
  bindInput('input-archive-desc', 'archiveDesc');
  
  // 开关绑定
  document.getElementById('potential-switch').addEventListener('click', async function() {
    this.classList.toggle('active');
    charData.enablePotential = this.classList.contains('active');
    await saveData();
    updatePreview(false);
  });
  
  document.getElementById('clickpreview-switch').addEventListener('click', async function() {
    this.classList.toggle('active');
    charData.enableClickPreview = this.classList.contains('active');
    await saveData();
    updatePreview(false);
  });
  
  document.getElementById('skill-mode-switch').addEventListener('click', async function() {
    this.classList.toggle('active');
    charData.enableSkillMode = this.classList.contains('active');
    if (!charData.enableSkillMode) {
      currentSkillMode = 'pve';
      setSkillModeUI('pve');
      syncEditAreaToMode();
    }
    await saveData();
    updatePreview(false);
  });
  
  document.getElementById('active-state-switch').addEventListener('click', async function() {
    this.classList.toggle('active');
    charData.activeState = this.classList.contains('active');
    await saveData();
    updatePreview(false);
    document.getElementById('material-select-group').style.display = (charData.enablePotential && !charData.activeState) ? 'flex' : 'none';
  });
  
  document.getElementById('material-select').addEventListener('change', async function() {
    charData.material = this.value;
    await saveData();
    updatePreview(false);
  });
  
  // 立绘上传
  document.getElementById('upload-avatar-btn').addEventListener('click', () => document.getElementById('avatar-file-input').click());
  document.getElementById('avatar-file-input').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async function(ev) {
      charData.avatarUrl = ev.target.result;
      await saveData();
      updatePreview(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  
  // 技能图标上传
  document.getElementById('upload-skill-icon-btn').addEventListener('click', () => document.getElementById('skill-icon-file-input').click());
  document.getElementById('skill-icon-file-input').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async function(ev) {
      charData.skillIconUrl = ev.target.result;
      await saveData();
      updatePreview(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  
  // ---------- 11. 导出数据（不含图片）----------
  function getExportData() {
    const { avatarUrl, skillIconUrl, bgUrl, ...textData } = charData;
    return {
      version: 1,
      charData: textData,
      transform: {
        translateX: translateX,
        translateY: translateY,
        scale: scale
      },
      currentSkillMode: currentSkillMode
    };
  }

  // ---------- 12. 保存图片（截图）----------
  document.getElementById('save-img-btn').addEventListener('click', async function() {
    const btn = this;
    let exportJson = false;
    
    // 判断当前是否在技能面板（默认面板）
    const isSkillPanel = !potentialPanelActive && !archivePanelActive;
    if (isSkillPanel) {
      exportJson = confirm('是否同时导出 JSON 数据？');
    }
    
    btn.innerText = "生成中...";
    btn.disabled = true;
    await document.fonts.ready;
    const element = document.getElementById('character-card-preview');
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
    });
    try {
      await Promise.all(imagePromises);
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: null, logging: false, useCORS: true, allowTaint: false });
      const jsonStr = JSON.stringify(getExportData(), null, 2);
      const originalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!originalBlob) {
        throw new Error('无法生成图片Blob');
      }
      embedDataToPNG(originalBlob, jsonStr, function(newBlob) {
        if (!newBlob) {
          alert('嵌入数据失败');
          btn.innerText = "保存图片";
          btn.disabled = false;
          return;
        }
        const link = document.createElement('a');
        let suffix = '';
        if (archivePanelActive) {
          suffix = '(档案)';
        } else if (potentialPanelActive) {
          suffix = '(潜能)';
        } else {
          if (charData.enableSkillMode) {
            suffix = `(${currentSkillMode})`;
          }
        }
        link.download = `角色卡_${charData.charName}${suffix}.png`;
        const url = URL.createObjectURL(newBlob);
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        
        // 如果需要导出 JSON，再单独下载一个 JSON 文件
        if (exportJson) {
          const jsonBlob = new Blob([jsonStr], { type: 'application/json' });
          const jsonLink = document.createElement('a');
          jsonLink.download = `角色卡_${charData.charName}${suffix}.json`;
          const jsonUrl = URL.createObjectURL(jsonBlob);
          jsonLink.href = jsonUrl;
          jsonLink.click();
          URL.revokeObjectURL(jsonUrl);
        }
        
        btn.innerText = "保存图片";
        btn.disabled = false;
      });
    } catch(err) {
      console.error('截图失败详情：', err);
      alert('截图失败：' + (err.message || err));
      btn.innerText = "保存图片";
      btn.disabled = false;
    }
  });

  // ---------- 13. 导入功能（支持 PNG 和 JSON）----------
  const importFileInput = document.getElementById('import-file-input');
  // 修改 accept 属性以同时支持 .png 和 .json
  importFileInput.setAttribute('accept', '.png,.json');
  
  document.getElementById('import-json-btn').addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', async () => {
    const file = importFileInput.files[0];
    if (!file) return;
    
    // 判断文件类型
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
    
    if (!isPng && !isJson) {
      alert('仅支持导入 PNG 图片或 JSON 文件');
      importFileInput.value = '';
      return;
    }
    
    let importedData = null;
    
    if (isPng) {
      // 从 PNG 提取元数据
      extractDataFromPNG(file, (jsonStr) => {
        if (!jsonStr) {
          alert('未在图片中检测到数据');
          importFileInput.value = '';
          return;
        }
        try {
          importedData = JSON.parse(jsonStr);
          applyImportedData(importedData);
        } catch (err) {
          alert('导入失败：数据格式错误');
          importFileInput.value = '';
        }
      });
    } else if (isJson) {
      // 直接读取 JSON 文件
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          importedData = JSON.parse(e.target.result);
          applyImportedData(importedData);
        } catch (err) {
          alert('导入失败：JSON 格式错误');
          importFileInput.value = '';
        }
      };
      reader.readAsText(file);
    }
  });
  
  async function applyImportedData(importedData) {
    if (!importedData.charData || importedData.version === undefined) {
      alert('数据不完整');
      importFileInput.value = '';
      return;
    }
    
    // 忽略图片字段
    const { avatarUrl: _, skillIconUrl: __, bgUrl: ___, ...rest } = importedData.charData;
    charData = { ...charData, ...rest };
    
    // 应用技能模式
    if (importedData.currentSkillMode && (importedData.currentSkillMode === 'pve' || importedData.currentSkillMode === 'pvp')) {
      currentSkillMode = importedData.currentSkillMode;
      const skillModePreview = document.getElementById('skill-mode-preview');
      if (skillModePreview) skillModePreview.style.display = 'block';
      setSkillModeUI(currentSkillMode);
      syncEditAreaToMode();
    }
    
    // 应用变换
    if (importedData.transform) {
      translateX = importedData.transform.translateX ?? 0;
      translateY = importedData.transform.translateY ?? 0;
      scale = importedData.transform.scale ?? 1;
      updateTransform();
    }
    
    await saveData();
    updatePreview(true);
    syncEditControls();
    updateEditAreaVisibility();
    
    // 检查 IndexedDB 中是否有立绘
    const hasAvatar = await loadFromDB('avatarUrl');
    if (!hasAvatar) {
      const wantUpload = confirm('立绘已丢失，是否重新上传？');
      if (wantUpload) {
          const fileInput = document.getElementById('avatar-file-input');
          fileInput.value = '';  
          document.getElementById('upload-avatar-btn').click();
      } else {
        // 使用默认立绘，坐标已在上方应用
        charData.avatarUrl = 'https://patchwiki.biligame.com/images/starengine/e/e3/sqjeojqr22j322mp104zwhwztfvdrei.png';
        updatePreview(false);
      }
    }
    
    importFileInput.value = '';
  }
  
  // ---------- 14. 重置按钮 ----------
  document.getElementById('reset-btn').addEventListener('click', async () => {
    if(confirm("确定要重置所有修改吗？")) {
      localStorage.removeItem('characterDIY_final5');
      await removeFromDB('avatarUrl');
      await removeFromDB('skillIconUrl');
      location.reload();
    }
  });

  // ---------- 15. 初始化 ----------
  loadAllData();
})();