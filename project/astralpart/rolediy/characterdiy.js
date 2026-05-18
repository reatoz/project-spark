(function() {
    // ---------- 1. PVE/PVP 模式切换 UI + 数据同步 ----------
    const circles = document.querySelectorAll('.circle');
    const indicator = document.querySelector('.active-indicator');
    const container = document.querySelector('.skill-tabs-list');
    let currentSkillMode = 'pve'; // 默认
    
    //  设置 UI 指示器位置，根据当前 active 的 circle 计算 translateX
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
          //  模式切换后刷新编辑区显示对应技能数据
          syncEditAreaToMode();
          updatePreview();
        });
      });
    }
    
    //  根据 currentSkillMode 将编辑区的技能输入框切换为 PVE 或 PVP 数据
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
  
    // 将 charData 的所有字段同步到对应编辑控件（用于导入数据后刷新 UI）
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
    
    // 保存当前编辑区技能数据到 charData（依据 currentSkillMode）
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
      img.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      img.addEventListener('wheel', onWheel, { passive: false });
      img.addEventListener('dragstart', (e) => e.preventDefault());
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
    
    function updateTransform() {
      img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
  
    // ---------- 3. 辅助函数 ----------
    // 对文本进行 HTML 实体转义，防止注入
    function escapeHtml(unsafe) {
      return unsafe.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
    }
    
    //  解析并转换 {{#颜色|文字}} 格式为 span 高亮，同时处理特殊空格和换行
    function parseColorText(text) {
      if (!text) return '';
      // 临时替换特殊空格避免被转义破坏
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
      // 恢复特殊空格
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
  
    // ---------- 5. 角色数据模型 ----------
    let charData = {
      charName: '米米',
      fullName: '',
      charTitle: '看板娘',
      tagSkill: '技能',
      tagUpgrade: '升级',
      tagPotential: '潜能',
      tagArchive: '档案',
      statAtk: 1, statDef: 1, statHp: 9,
      levelNumber: 5,   // 默认值设为 5 与 HTML value=5 一致
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
  
    //  尝试从 localStorage 恢复保存的数据，使用 spread 合并避免缺失新属性
    try {
      const saved = localStorage.getItem('characterDIY_final5');
      if (saved) {
        const parsed = JSON.parse(saved);
        charData = { ...charData, ...parsed };
      }
    } catch(e) { console.warn(e); }
  
    function saveData() {
      try {
        localStorage.setItem('characterDIY_final5', JSON.stringify(charData));
      } catch(e) { console.warn(e); }
    }
  
    // ---------- PNG 元数据工具 ----------
    //  将字符串转为 Uint8Array
    function stringToBytes(str) {
      return new TextEncoder().encode(str);
    }
    function bytesToString(bytes) {
      return new TextDecoder().decode(bytes);
    }
    //  从字节数组中读取32位无符号整数（大端）
    function readUint32(bytes, offset) {
      return (bytes[offset] << 24) | (bytes[offset+1] << 16) | (bytes[offset+2] << 8) | bytes[offset+3];
    }
    function writeUint32(bytes, offset, value) {
      bytes[offset] = (value >> 24) & 0xFF;
      bytes[offset+1] = (value >> 16) & 0xFF;
      bytes[offset+2] = (value >> 8) & 0xFF;
      bytes[offset+3] = value & 0xFF;
    }
    //  计算 CRC32 校验和
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
    //  在 PNG 文件的 IEND 块之前插入一个 tEXt 块，存入 JSON 数据
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
        chunkData[keyBytes.length] = 0; // null 分隔符
        chunkData.set(textBytes, keyBytes.length + 1);
        const typeBytes = stringToBytes('tEXt');
        const crcInput = new Uint8Array(4 + chunkData.length);
        crcInput.set(typeBytes);
        crcInput.set(chunkData, 4);
        const computedCrc = crc32(crcInput, 0, crcInput.length);
  
        // 查找 IEND 位置
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
    //  从 PNG 文件的 tEXt 块中提取自定义数据（键为 starengine）
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
  
    // ---------- 6. 面板切换逻辑 ----------
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
  
    //  根据当前激活的面板显示对应编辑区
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
  
    //  更新底部标签样式，激活的标签使用高亮背景，其余强制变暗
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
      //  只有开启了技能模式开关，且当前未强制隐藏时才显示
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
    
    //  点击技能或升级标签时，关闭所有特殊面板，回到默认面板
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
  
    // ---------- 7. 核心预览更新函数 ----------
    //  根据 charData 和当前模式，更新预览卡片的所有元素；isInit 为 true 时额外同步编辑区控件
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
      
      // 若关闭潜能后仍处于潜能面板激活状态，自动切回默认
      if (!charData.enablePotential && potentialPanelActive) {
        potentialPanelActive = false;
        defaultPanel.style.display = 'block';
        potentialPanel.style.display = 'none';
        updateTagColors();
        updateEditAreaVisibility();
      }
      
      // 根据当前模式显示技能
      const activeName = (currentSkillMode === 'pve') ? charData.pveActiveName : charData.pvpActiveName;
      const activeDesc = (currentSkillMode === 'pve') ? charData.pveActiveDesc : charData.pvpActiveDesc;
      const passiveName = (currentSkillMode === 'pve') ? charData.pvePassiveName : charData.pvpPassiveName;
      const passiveDesc = (currentSkillMode === 'pve') ? charData.pvePassiveDesc : charData.pvpPassiveDesc;
      
      document.getElementById('preview-active-skill-name').innerText = '主动技能：' + (activeName || '');
      document.getElementById('preview-active-desc').innerHTML = parseColorText(activeDesc);
      document.getElementById('preview-passive-skill-name').innerText = '被动技能：' + (passiveName || '');
      document.getElementById('preview-passive-desc').innerHTML = parseColorText(passiveDesc);
      document.getElementById('preview-cd-time').innerText = charData.cdTime;
      
      // 更新爱心容器状态
      const heartContainers = document.querySelectorAll('.heart-container');
      heartContainers.forEach((container, index) => {
        if (index < charData.intimacyLevel) container.classList.add('filled');
        else container.classList.remove('filled');
      });
      
      // 亲密度满级时进度条变为红色，否则半透明黑
      const intimacyBar = document.querySelector('.intimacy-bar');
      if (intimacyBar) intimacyBar.style.backgroundColor = (charData.intimacyLevel < 5) ? 'rgba(0,0,0,0.5)' : '#e62260';
      
      const levelTexts = ['0/20', '0/120', '0/600', '0/3000', '0/6000', 'MAX'];
      document.getElementById('preview-intimacy-value').innerText = levelTexts[charData.intimacyLevel] || '0/20';
      
      const avatarImg = document.getElementById('preview-avatar');
      if (avatarImg.src !== charData.avatarUrl) {
        avatarImg.crossOrigin = "anonymous";
        avatarImg.src = charData.avatarUrl;
        avatarImg.onload = function() {
          // 若存在延迟变换（导入时设置），则应用，否则重置图片位置缩放
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
      
      // 根据激活状态显示未激活面板或已激活光效
      const potentialNo = document.querySelector('.potential-no');
      const potentialLight = document.querySelector('.potential-light');
      if (potentialNo && potentialLight) {
        potentialNo.style.display = charData.activeState ? 'none' : 'grid';
        potentialLight.style.display = charData.activeState ? 'block' : 'none';
      }
      
      const materialImg = document.querySelector('.potential-no-items2-stuff img');
      if (materialImg) materialImg.src = materialImages[charData.material] || materialImages.yangyan;
      
      // 档案：全名为空时用角色名代替
      const displayFullName = charData.fullName && charData.fullName.trim() !== '' ? charData.fullName : charData.charName;
      document.getElementById('char-archive-name').innerText = charData.charName;
      document.getElementById('char-archive-title').innerText = charData.charTitle;
      document.getElementById('char-archive-desc-name').innerHTML = parseColorText(displayFullName);
      document.getElementById('char-archive-desc-birthday').innerHTML = parseColorText(charData.archiveBirthday);
      document.getElementById('char-archive-desc-likefood').innerHTML = parseColorText(charData.archiveLikeFood);
      document.getElementById('char-archive-desc-desc').innerHTML = parseColorText(charData.archiveDesc);
      
      document.getElementById('skill-tag-icon').src = charData.skillIconUrl;
      
      //  首次初始化时同步开关状态和编辑控件
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
      
      //  修正左侧称号/名字的绝对定位偏移量，确保文字长度变化时仍保持在原始右侧位置
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
        //  初次记录目标右边界，后续根据其与当前实际右边界差值调整 translateX
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
  
    // ---------- 8. 编辑区输入绑定 ----------
    // 双向绑定辅助：监听 contenteditable 的 input 事件，更新 charData 并保存，刷新预览
    function bindInput(id, key, isNumber = false) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function() {
        let val = this.innerText.trim();
        if (isNumber) val = parseInt(val) || 0;
        charData[key] = val;
        saveData();
        updatePreview(false);
      });
    }
    
    const textFields = [
      ['input-char-name', 'charName'],
      ['input-archive-fullname', 'fullName'],
    ];
    textFields.forEach(f => bindInput(f[0], f[1]));
  
    // ---------- 限制称号输入长度 ----------
    const titleDiv = document.getElementById('input-char-title');
    const MAX_TITLE_LENGTH = 9;
  
    // 通过 beforeinput 拦截，防止超过最大长度的插入
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
  
    // input 事件兜底，强制截断并同步数据
    titleDiv.addEventListener('input', function() {
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
      saveData();
      updatePreview(false);
    });
    
    const numFields = [
      ['input-stat-atk', 'statAtk', true],
      ['input-stat-def', 'statDef', true],
      ['input-stat-hp', 'statHp', true]
    ];
    numFields.forEach(f => bindInput(f[0], f[1], f[2]));
    
    // 合作挑战等级单独监听，限制 0-6 范围
    document.getElementById('input-level-number').addEventListener('input', function() {
      let val = parseInt(this.value, 10);
      if (isNaN(val)) val = 0;
      val = Math.min(6, Math.max(0, val));
      this.value = val;
      charData.levelNumber = val;
      saveData();
      updatePreview(false);
    });
    
    // 亲密度等级监听，限制 0-5 范围
    document.getElementById('input-intimacy-level').addEventListener('input', function() {
      let val = parseInt(this.value, 10);
      if (isNaN(val)) val = 0;
      val = Math.min(5, Math.max(0, val));
      charData.intimacyLevel = val;
      this.value = val;
      saveData();
      updatePreview(false);
    });
    
    // 技能字段绑定，根据当前模式写入对应的 PVE/PVP 数据
    function bindSkillInput(id, modeKeyFunc) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function() {
        const value = this.innerText.trim();
        const key = modeKeyFunc(currentSkillMode);
        charData[key] = value;
        saveData();
        updatePreview(false);
      });
    }
    
    bindSkillInput('input-active-name', (mode) => mode === 'pve' ? 'pveActiveName' : 'pvpActiveName');
    bindSkillInput('input-cd-time', () => 'cdTime');
    bindSkillInput('input-active-desc', (mode) => mode === 'pve' ? 'pveActiveDesc' : 'pvpActiveDesc');
    bindSkillInput('input-passive-name', (mode) => mode === 'pve' ? 'pvePassiveName' : 'pvpPassiveName');
    bindSkillInput('input-passive-desc', (mode) => mode === 'pve' ? 'pvePassiveDesc' : 'pvpPassiveDesc');
    
    // 潜能、档案编辑区绑定
    bindInput('input-potential-desc', 'potentialDesc');
    bindInput('input-archive-birthday', 'archiveBirthday');
    bindInput('input-archive-likefood', 'archiveLikeFood');
    bindInput('input-archive-desc', 'archiveDesc');
    
    // 开关绑定
    document.getElementById('potential-switch').addEventListener('click', function() {
      this.classList.toggle('active');
      charData.enablePotential = this.classList.contains('active');
      saveData();
      updatePreview(false);
    });
    
    document.getElementById('clickpreview-switch').addEventListener('click', function() {
      this.classList.toggle('active');
      charData.enableClickPreview = this.classList.contains('active');
      saveData();
      updatePreview(false);
    });
    
    document.getElementById('skill-mode-switch').addEventListener('click', function() {
      this.classList.toggle('active');
      charData.enableSkillMode = this.classList.contains('active');
      // 关闭技能模式切换时，强制回到 PVE 模式，避免编辑区残留 PVP 内容
      if (!charData.enableSkillMode) {
        currentSkillMode = 'pve';
        setSkillModeUI('pve');
        syncEditAreaToMode();
      }
      saveData();
      updatePreview(false);
    });
    
    document.getElementById('active-state-switch').addEventListener('click', function() {
      this.classList.toggle('active');
      charData.activeState = this.classList.contains('active');
      saveData();
      updatePreview(false);
      document.getElementById('material-select-group').style.display = (charData.enablePotential && !charData.activeState) ? 'flex' : 'none';
    });
    
    document.getElementById('material-select').addEventListener('change', function() {
      charData.material = this.value;
      saveData();
      updatePreview(false);
    });
    
    // 立绘上传
    document.getElementById('upload-avatar-btn').addEventListener('click', () => document.getElementById('avatar-file-input').click());
    document.getElementById('avatar-file-input').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        charData.avatarUrl = ev.target.result;
        saveData();
        updatePreview(false);
      };
      reader.readAsDataURL(file);
    });
    
    // 技能图标上传
    document.getElementById('upload-skill-icon-btn').addEventListener('click', () => document.getElementById('skill-icon-file-input').click());
    document.getElementById('skill-icon-file-input').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        charData.skillIconUrl = ev.target.result;
        saveData();
        updatePreview(false);
      };
      reader.readAsDataURL(file);
    });
    
    // ---------- 9. 保存图片（使用 html2canvas + PNG 元数据） ----------
    document.getElementById('save-img-btn').addEventListener('click', async function() {
      const btn = this;
      btn.innerText = "生成中...";
      btn.disabled = true;
      await document.fonts.ready;
      const element = document.getElementById('character-card-preview');
      const images = element.getElementsByTagName('img');
      //  等待所有图片加载完成再进行截图，避免出现空白
      const imagePromises = Array.from(images).map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
      });
      try {
        await Promise.all(imagePromises);
        const canvas = await html2canvas(element, { scale: 2, backgroundColor: null, logging: false, useCORS: true, allowTaint: false });
        const jsonStr = JSON.stringify(getExportData());
        const originalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!originalBlob) {
          throw new Error('无法生成图片Blob');
        }
        //  将导出数据嵌入 PNG 的 tEXt 块
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
  
    // ---------- 10.导出 / 导入 ----------
    const importJsonBtn = document.getElementById('import-json-btn');
  
    //  收集当前完整导出数据，包括角色数据、图片变换、技能模式
    function getExportData() {
      return {
        version: 1,
        charData: { ...charData },
        transform: {
          translateX: translateX,
          translateY: translateY,
          scale: scale
        },
        currentSkillMode: currentSkillMode
      };
    }
  
    
    // 导入文件处理
    const importFileInput = document.getElementById('import-file-input');
    importJsonBtn.addEventListener('click', () => {
      importFileInput.click();
    });
  
    importFileInput.addEventListener('change', () => {
      const file = importFileInput.files[0];
      if (!file) return;
      extractDataFromPNG(file, function(jsonStr) {
        if (!jsonStr) {
          alert('未检测到数据');
          importFileInput.value = '';
          return;
        }
        let imported;
        try {
          imported = JSON.parse(jsonStr);
          if (!imported.charData || imported.version === undefined) throw new Error('数据不完整');
        } catch (err) {
          alert('导入失败：数据格式错误');
          importFileInput.value = '';
          return;
        }
  
        //  忽略图片 URL 字段，避免覆盖用户已上传的立绘和图标
        const ignoredKeys = ['avatarUrl', 'skillIconUrl', 'bgUrl'];
        Object.keys(imported.charData).forEach(key => {
          if (!ignoredKeys.includes(key)) charData[key] = imported.charData[key];
        });
  
        // 应用技能模式
        if (imported.currentSkillMode && (imported.currentSkillMode === 'pve' || imported.currentSkillMode === 'pvp')) {
          currentSkillMode = imported.currentSkillMode;
          const skillModePreview = document.getElementById('skill-mode-preview');
          if (skillModePreview) skillModePreview.style.display = 'block';
          setSkillModeUI(currentSkillMode);
          syncEditAreaToMode();
        }
  
        // 应用变换
        if (imported.transform) {
          translateX = imported.transform.translateX ?? 0;
          translateY = imported.transform.translateY ?? 0;
          scale = imported.transform.scale ?? 1;
          updateTransform();
        }
  
        //  刷新界面，通过临时重写 updatePreview 强制以初始化模式调用一次，确保编辑控件同步
        const originalUpdatePreview = updatePreview;
        updatePreview = function(tempIsInit) {
          originalUpdatePreview(true);
          updatePreview = originalUpdatePreview;
        };
        saveData();
        updatePreview(true);
        syncEditControls();
        updateEditAreaVisibility();
  
        //  导入后询问用户是否更换立绘，并保持当前变换状态（用于新图片加载后应用）
        const wantChangeAvatar = confirm('数据已加载。是否需要更换立绘？\n技能图标需手动上传。');
        if (wantChangeAvatar) {
          window._pendingTransform = { translateX, translateY, scale };
          const uploadBtn = document.getElementById('upload-avatar-btn');
          if (uploadBtn) uploadBtn.click();
        }
        importFileInput.value = '';
      });
    });
    // 导入文件处理结束
    
    // ---------- 11. 重置按钮（清空本地存储并刷新） ----------
    document.getElementById('reset-btn').addEventListener('click', () => {
      if(confirm("确定要重置所有修改吗？")) {
        localStorage.removeItem('characterDIY_final5');
        location.reload();
      }
    });
  
    // ---------- 12. 初始化：拖拽、预览、隐藏档案编辑控件 ----------
    img = document.getElementById('preview-avatar');
    initImageInteractions();
    setSkillModeUI(currentSkillMode);
    updatePreview(true);
    updateEditAreaVisibility();
  
  })();