/**
 * update-log.js
 * 通用更新日志组件
 * 使用方式：在 <script> 标签上通过 data-log-url 属性指定 JSON 文件路径
 * 例如：<script src="/js/update-log.js" data-log-url="card-diy-update-log.json"></script>
 */
(function() {
    const currentScript = document.currentScript;
    const logUrl = currentScript ? currentScript.getAttribute('data-log-url') : null;
    if (!logUrl) return;
  
    // 标记 key：记录用户是否已经查看过（关闭过弹窗）
    const STORAGE_KEY = 'update-log-closed_' + logUrl.replace(/[^a-zA-Z0-9]/g, '_');
  
    fetch(logUrl)
        .then(response => response.json())
        .then(logs => {
            if (!Array.isArray(logs) || logs.length === 0) return;
            initUpdateLog(logs);
        })
        .catch(() => {});
  
    function initUpdateLog(logs) {
        const latestVersion = logs[0].version;
        const hasClosed = localStorage.getItem(STORAGE_KEY) === '1';
  
        // ---------- 创建入口 ----------
        const trigger = document.createElement('div');
        trigger.id = 'update-log-trigger';
  
        // 根据是否已关闭过决定初始样式
        if (hasClosed) {
            trigger.classList.add('circle');
            trigger.innerHTML = `<span id="update-version-text">${escapeHtml(latestVersion)}</span>`;
        } else {
            trigger.classList.add('bar');
            trigger.innerHTML = `发现更新：<span id="update-version-text">${escapeHtml(latestVersion)}</span> 点击此处查看`;
        }
  
        // ---------- 创建遮罩和弹窗 ----------
        const overlay = document.createElement('div');
        overlay.id = 'update-log-overlay';
        const modal = document.createElement('div');
        modal.id = 'update-log-modal';
        modal.innerHTML = `
            <div id="update-log-header">
                <span>更新历史</span>
                <button id="update-log-close">&times;</button>
            </div>
            <div id="update-log-content"></div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(trigger);
        document.body.appendChild(overlay);
  
        // 填充内容
        const content = modal.querySelector('#update-log-content');
        content.innerHTML = logs.map(log => `
            <div class="log-item">
                <div class="log-version">${escapeHtml(log.version)} <span class="log-date">(${escapeHtml(log.date)})</span></div>
                <ul class="log-changes">${log.changes.map(change => {
                    const cls = change.startsWith('- ') ? 'class="sub-change"' : '';
                    return `<li ${cls}>${escapeHtml(change)}</li>`;}).join('')}
                </ul>
            </div>
        `).join('');
  
        // ---------- 事件绑定 ----------
        trigger.addEventListener('click', () => {
            overlay.style.display = 'flex';
        });
  
        const closeBtn = modal.querySelector('#update-log-close');
        function closeOverlay() {
            overlay.style.display = 'none';
            // 首次关闭时切换到圆形
            if (!localStorage.getItem(STORAGE_KEY)) {
                localStorage.setItem(STORAGE_KEY, '1');
                trigger.classList.remove('bar');
                trigger.classList.add('circle');
                trigger.innerHTML = `<span id="update-version-text">${escapeHtml(latestVersion)}</span>`;
            }
        }
        closeBtn.addEventListener('click', closeOverlay);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeOverlay();
        });
    }
  
    function escapeHtml(unsafe) {
        return unsafe.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m] || m);
    }
  })();