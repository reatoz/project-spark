// ========== 公告列表渲染 ==========
const listEl = document.getElementById('news-list');

async function loadNews() {
  try {
    const resp = await fetch('/js/news-config.json');
    if (!resp.ok) throw new Error('加载失败');
    const newsList = await resp.json();
    renderNews(newsList);
  } catch (err) {
    listEl.innerHTML = '<li style="color:#aaa;">公告加载失败，请稍后刷新。</li>';
  }
}

function renderNews(newsList) {
  // 分离置顶和非置顶
  const pinned = newsList.filter(item => item.pinned);
  const normal = newsList.filter(item => !item.pinned);

  // 非置顶公告按日期倒序排列
  normal.sort((a, b) => new Date(b.date) - new Date(a.date));

  const sortedList = [...pinned, ...normal];

  listEl.innerHTML = sortedList.map(item => {
    let detailUrl;
    if (item.type === 'md') {
      detailUrl = `/news/?file=${encodeURIComponent(item.url)}`;
    } else {
      detailUrl = item.url;
    }
    return `
      <li style="border-bottom:1px solid rgba(255,255,255,0.2); padding:12px 0;">
        <a href="${detailUrl}" style="color:#fff; text-decoration:none; display:block;">
          <div style="font-size:1rem; font-weight:500;color:#fff;">
          ${item.pinned ? '<span style="color:#f0a500;">[置顶]</span> ' : ''}${item.title}
          </div>
          <div style="font-size:0.8rem; color:#2a2a2a; margin-top:4px;">${item.date} · ${item.summary}</div>
        </a>
      </li>
    `;
  }).join('');
}

loadNews();