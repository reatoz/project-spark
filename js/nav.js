// =============================================
// 自动注入顶部导航栏（所有子页面通用）
// 使用方式：在子页面 </body> 前引入 <script src="/js/nav.js"></script>
// =============================================

(function () {
    // 避免重复注入
    if (document.getElementById('auto-nav')) return;
  
    // ---------- 1. 注入导航栏所需 CSS ----------
    const style = document.createElement('style');
    style.textContent = `
      /* 导航栏重置 */
      #auto-nav, #auto-nav * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      #auto-nav {
        width: 100%;
        padding: 2vh 5vw;
        display: flex;
        justify-content: center;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        position: relative;
        z-index: 999;
        background: transparent;
      }
      #auto-nav .nav-links {
        display: flex;
        align-items: center;
        gap: clamp(1.5rem, 4vw, 3rem);
      }
      #auto-nav .nav-links a,
      #auto-nav .dropbtn {
        text-decoration: none;
        color: rgba(255, 255, 255, 0.9);
        font-size: clamp(0.9rem, 1.2vw, 1.1rem);
        font-weight: 400;
        text-shadow: 0 1px 3px rgba(0,0,0,0.15);
        padding: 0.3em 0;
        cursor: pointer;
        background: none;
        border: none;
      }
      #auto-nav .nav-links a:hover,
      #auto-nav .dropbtn:hover {
        color: #fff;
        text-shadow: 0 0 8px rgba(255,255,255,0.6);
      }
      #auto-nav .dropdown {
        position: relative;
        display: inline-flex;
        align-items: center;
      }
      #auto-nav .dropdown-content {
        display: none;
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(12px);
        border-radius: 12px;
        min-width: 160px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        z-index: 1001;
        padding: 0.4em 0;
      }
      #auto-nav .dropdown-content a {
        display: block;
        padding: 0.6em 1.2em;
        color: #fff;
        text-decoration: none;
        font-size: 0.9rem;
        white-space: nowrap;
      }
      #auto-nav .dropdown-content a:hover {
        background: rgba(255,255,255,0.3);
      }
      #auto-nav .dropdown:hover .dropdown-content {
        display: block;
      }
    `;
    document.head.appendChild(style);
  
    // ---------- 2. 创建导航栏 HTML 结构 ----------
    const navHTML = `
      <header id="auto-nav">
        <nav class="nav-links">
          <a href="/">首页</a>
          <a href="/messages/">留言</a>
          <a href="/issues/">Issues</a>
          <div class="dropdown">
            <span class="dropbtn">小工具</span>
            <div class="dropdown-content">
              <a href="/project/astralpart/rolediy/">星趴角色模拟器</a>
              <a href="/project/astralpart/rolediy/indexold.html">星趴角色模拟器(旧)</a>
              <a href="/project/astralpart/carddiy/">星趴卡牌制作器</a>
              <a href="/project/astralpart/maplandnum/">星趴地图路径</a>
              <!-- 新增工具，在这里添加新的 <a> 链接 -->
            </div>
          </div>
        </nav>
      </header>
    `;
  
    // ---------- 3. 将导航插入到 body 最前面 ----------
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  })();