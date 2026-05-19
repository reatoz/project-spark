(function () {
  'use strict';

  // -------------------- 配置 --------------------
  const MAPS_BASE_PATH = './maps/';
  const CELL_SIZE_MIN = 30;
  const CELL_SIZE_MAX = 55;
  const CELL_SIZE_DEFAULT = 35;
  
  const ARROW_LINE_WIDTH = 2;
  const ARROW_HEAD_SIZE_FACTOR = 0.12;
  const ARROW_INSET_FACTOR = 0.2;

  // -------------------- 工具函数 --------------------
  function parseGrid(gridStr) {
    const match = gridStr.match(/^(\d+)x(\d+)$/i);
    if (!match) throw new Error('grid 格式错误，应为 "列x行"，例如 "11x13"');
    return { cols: parseInt(match[1], 10), rows: parseInt(match[2], 10) };
  }

  function colToIndex(colStr) {
    return colStr.toUpperCase().charCodeAt(0) - 64;
  }

  function parseCoord(coord) {
    const match = coord.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) throw new Error(`坐标格式错误: ${coord}`);
    return { col: colToIndex(match[1]), row: parseInt(match[2], 10) };
  }

  function parseArrow(arrowStr) {
    const parts = arrowStr.split('->');
    if (parts.length !== 2) throw new Error(`箭头格式错误: ${arrowStr}`);
    return {
      from: parseCoord(parts[0].trim()),
      to: parseCoord(parts[1].trim())
    };
  }

  // -------------------- 地图渲染器 --------------------
  class MapRenderer {
    constructor(container, mapData) {
      this.container = container;
      this.data = mapData;
      this.cols = 0;
      this.rows = 0;
      this.wrapper = null;
      this.gridEl = null;
      this.canvasEl = null;
      this.arrowDefs = [];
      this.resizeObserver = null;
      this.cellSize = CELL_SIZE_DEFAULT;

      // 存储每个原始坐标对应的矩形信息，用于箭头定位
      // 键: "A1" , 值: { rectCol, rectRow, spanCols, spanRows, content }
      this.cellRectMap = {};

      this.init();
    }

    init() {
      const { cols, rows } = parseGrid(this.data.grid);
      this.cols = cols;
      this.rows = rows;
      this.buildDOM();
      this.buildGrid();
      this.buildArrows();
      this.container.appendChild(this.wrapper);
      this.setupResizeObserver();
    }

    buildDOM() {
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'map-wrapper';
      this.wrapper.style.position = 'relative';
      this.wrapper.style.display = 'inline-block';
      this.wrapper.style.width = 'fit-content';
      this.wrapper.style.maxWidth = (this.cols * CELL_SIZE_MAX) + 'px';
      this.wrapper.style.minWidth = (this.cols * CELL_SIZE_MIN) + 'px';

      this.gridEl = document.createElement('div');
      this.gridEl.className = 'map-grid';
      this.gridEl.style.display = 'grid';
      this.gridEl.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
      this.gridEl.style.gridTemplateRows = `repeat(${this.rows}, var(--cell-size))`;
      this.gridEl.style.setProperty('--cell-size', this.cellSize + 'px');
      this.wrapper.appendChild(this.gridEl);

      this.canvasEl = document.createElement('canvas');
      this.canvasEl.className = 'map-arrows-canvas';
      this.canvasEl.style.position = 'absolute';
      this.canvasEl.style.top = '0';
      this.canvasEl.style.left = '0';
      this.canvasEl.style.width = '100%';
      this.canvasEl.style.height = '100%';
      this.canvasEl.style.pointerEvents = 'none';
      this.wrapper.appendChild(this.canvasEl);
    }

    buildGrid() {
      const content = this.data.content || {};
      // 创建二维数组存储每个格子的数字（0 表示空）
      const gridValues = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
      for (let r = 1; r <= this.rows; r++) {
        for (let c = 1; c <= this.cols; c++) {
          const coord = `${String.fromCharCode(64 + c)}${r}`;
          const val = content[coord];
          if (val !== undefined && val !== null && !isNaN(Number(val))) {
            gridValues[r - 1][c - 1] = Number(val);
          }
        }
      }

      // 找出所有最大矩形
      const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
      const rectangles = []; // 每个元素: { col, row, colSpan, rowSpan, value }

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (visited[r][c] || gridValues[r][c] === null) continue;
          const value = gridValues[r][c];
          // 向右扩展
          let colSpan = 1;
          while (c + colSpan < this.cols && gridValues[r][c + colSpan] === value && !visited[r][c + colSpan]) {
            colSpan++;
          }
          // 向下扩展
          let rowSpan = 1;
          let canExtendDown = true;
          while (r + rowSpan < this.rows && canExtendDown) {
            // 检查下一行相同的列区间是否全部相同且未访问
            for (let dc = 0; dc < colSpan; dc++) {
              if (gridValues[r + rowSpan][c + dc] !== value || visited[r + rowSpan][c + dc]) {
                canExtendDown = false;
                break;
              }
            }
            if (canExtendDown) rowSpan++;
          }

          // 标记矩形内所有格子为已访问
          for (let dr = 0; dr < rowSpan; dr++) {
            for (let dc = 0; dc < colSpan; dc++) {
              visited[r + dr][c + dc] = true;
            }
          }

          rectangles.push({
            col: c + 1, // 转为 1-based
            row: r + 1,
            colSpan,
            rowSpan,
            value
          });
        }
      }

      // 根据矩形创建 DOM 元素
      this.gridEl.innerHTML = '';
      // 清空矩形映射
      this.cellRectMap = {};

      for (const rect of rectangles) {
        const div = document.createElement('div');
        div.className = 'cell-active';
        div.style.backgroundColor = '#4B3941';
        div.style.color = '#fff';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontWeight = 'bold';
        div.style.gridColumn = `${rect.col} / span ${rect.colSpan}`;
        div.style.gridRow = `${rect.row} / span ${rect.rowSpan}`;
        // 字体大小根据矩形最小边长缩放
        const minSide = Math.min(rect.colSpan, rect.rowSpan);
        div.style.fontSize = `calc(var(--cell-size) * ${0.35 + minSide * 0.15})`;
        div.textContent = rect.value;

        this.gridEl.appendChild(div);

        // 记录矩形内每个原始坐标的映射
        for (let dr = 0; dr < rect.rowSpan; dr++) {
          for (let dc = 0; dc < rect.colSpan; dc++) {
            const coord = `${String.fromCharCode(64 + rect.col + dc)}${rect.row + dr}`;
            this.cellRectMap[coord] = {
              rectCol: rect.col,
              rectRow: rect.row,
              spanCols: rect.colSpan,
              spanRows: rect.rowSpan,
              value: rect.value
            };
          }
        }
      }

      // 对于空单元格，还需要生成占位 div（保持网格结构）
      // 遍历所有格子，如果不在矩形中，生成空 div
      for (let r = 1; r <= this.rows; r++) {
        for (let c = 1; c <= this.cols; c++) {
          const coord = `${String.fromCharCode(64 + c)}${r}`;
          if (!this.cellRectMap[coord] && gridValues[r - 1][c - 1] === null) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'cell-empty';
            emptyDiv.style.backgroundColor = 'transparent';
            emptyDiv.style.gridColumn = c;
            emptyDiv.style.gridRow = r;
            this.gridEl.appendChild(emptyDiv);
          }
        }
      }
    }

    // 根据原始坐标获取小格子中心像素坐标
    getCellCenter(col, row) {
      // 如果有合并矩形，则使用原始格子自己的中心
      const coord = `${String.fromCharCode(64 + col)}${row}`;
      if (this.cellRectMap[coord]) {
        // 直接计算该原始格子的中心（不受矩形影响）
        const x = (col - 0.5) * this.cellSize;
        const y = (row - 0.5) * this.cellSize;
        return { x, y };
      } else {
        // 未定义内容的格子，理论上不应该有箭头指向，但仍可计算
        return {
          x: (col - 0.5) * this.cellSize,
          y: (row - 0.5) * this.cellSize
        };
      }
    }

    buildArrows() {
      const arrowsData = this.data.arrows || [];
      const seenDirections = new Set();

      for (const group of arrowsData) {
        const color = group.color || '#000';
        const directions = group.directions || [];
        for (const dirStr of directions) {
          const dirKey = dirStr.trim();
          if (seenDirections.has(dirKey)) continue;
          seenDirections.add(dirKey);

          const arrow = parseArrow(dirStr);
          this.arrowDefs.push({
            color,
            fromCol: arrow.from.col,
            fromRow: arrow.from.row,
            toCol: arrow.to.col,
            toRow: arrow.to.row
          });
        }
      }
      this.drawArrowsOnCanvas();
    }

    drawArrowsOnCanvas() {
      if (!this.canvasEl) return;
      const cs = this.cellSize;
      const totalWidth = this.cols * cs;
      const totalHeight = this.rows * cs;

      const dpr = window.devicePixelRatio || 1;
      this.canvasEl.width = totalWidth * dpr;
      this.canvasEl.height = totalHeight * dpr;
      this.canvasEl.style.width = totalWidth + 'px';
      this.canvasEl.style.height = totalHeight + 'px';

      const ctx = this.canvasEl.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, totalWidth, totalHeight);

      const headSize = cs * ARROW_HEAD_SIZE_FACTOR;

      for (const def of this.arrowDefs) {
        const { color, fromCol, fromRow, toCol, toRow } = def;
        // 使用原始坐标的中心点
        const fromCenter = this.getCellCenter(fromCol, fromRow);
        const toCenter = this.getCellCenter(toCol, toRow);

        const startX = fromCenter.x;
        const startY = fromCenter.y;
        const endX = toCenter.x;
        const endY = toCenter.y;

        const dx = endX - startX;
        const dy = endY - startY;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.001) continue;

        const isDiagonal = (Math.abs(fromCol - toCol) > 0 && Math.abs(fromRow - toRow) > 0);
        const insetFactor = isDiagonal ? 0.28 : ARROW_INSET_FACTOR;
        const inset = cs * insetFactor;

        const ux = dx / len;
        const uy = dy / len;

        const fromX = startX + ux * inset;
        const fromY = startY + uy * inset;
        const toX = endX - ux * inset;
        const toY = endY - uy * inset;

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = ARROW_LINE_WIDTH;
        ctx.stroke();

        const angle = Math.atan2(dy, dx);
        const tipX = toX;
        const tipY = toY;
        const arrowAngle = 0.4;

        const p1x = tipX - headSize * Math.cos(angle - arrowAngle);
        const p1y = tipY - headSize * Math.sin(angle - arrowAngle);
        const p2x = tipX - headSize * Math.cos(angle + arrowAngle);
        const p2y = tipY - headSize * Math.sin(angle + arrowAngle);

        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // 强制刷新尺寸
    refreshSize() {
      const displayArea = document.getElementById('mapDisplay');
      if (!displayArea) return;
      const containerWidth = displayArea.clientWidth;
      if (containerWidth === 0) return;
      let newSize = containerWidth / this.cols;
      newSize = Math.max(CELL_SIZE_MIN, Math.min(CELL_SIZE_MAX, newSize));
      if (Math.abs(newSize - this.cellSize) > 0.5) {
        this.cellSize = newSize;
        this.gridEl.style.setProperty('--cell-size', newSize + 'px');
        this.drawArrowsOnCanvas();
      }
    }

    setupResizeObserver() {
      this._resizeHandler = () => {
        if (this._resizeTimer) cancelAnimationFrame(this._resizeTimer);
        this._resizeTimer = requestAnimationFrame(() => {
          this.refreshSize();
        });
      };
      window.addEventListener('resize', this._resizeHandler);
      this.refreshSize();
    }

    destroy() {
      if (this._resizeHandler) {
        window.removeEventListener('resize', this._resizeHandler);
        this._resizeHandler = null;
      }
      if (this._resizeTimer) {
        cancelAnimationFrame(this._resizeTimer);
        this._resizeTimer = null;
      }
    }
  }

  // -------------------- 切换逻辑 --------------------
  function initMapSwitcher() {
    const displayArea = document.getElementById('mapDisplay');
    if (!displayArea) return;

    const tabButtons = document.querySelectorAll('.map-tab');
    if (tabButtons.length === 0) return;

    const mapInstances = new Map();

    displayArea.innerHTML = '';

    async function loadAndShowMap(mapname, button) {
      if (mapInstances.has(mapname)) {
        const { wrapper, renderer } = mapInstances.get(mapname);
        for (const [, instance] of mapInstances) {
          instance.wrapper.style.display = 'none';
        }
        wrapper.style.display = '';
        requestAnimationFrame(() => {
          renderer.refreshSize();
        });
      } else {
        button.disabled = true;
        try {
          const url = `${MAPS_BASE_PATH}${mapname}.json`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const mapData = await response.json();
          if (!mapData.grid) throw new Error('JSON 缺少 grid 字段');

          const wrapperContainer = document.createElement('div');
          wrapperContainer.style.display = '';
          displayArea.appendChild(wrapperContainer);

          const renderer = new MapRenderer(wrapperContainer, mapData);
          mapInstances.set(mapname, { renderer, wrapper: wrapperContainer });

          for (const [name, instance] of mapInstances) {
            if (name !== mapname) {
              instance.wrapper.style.display = 'none';
            }
          }
        } catch (err) {
          console.error(`加载地图失败 [${mapname}]:`, err);
        } finally {
          button.disabled = false;
        }
      }

      // 更新激活状态
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // 更新页脚链接
      const footerLink = document.getElementById('footer-wiki-link');
      if (footerLink) {
        const mapName = button.getAttribute('data-mapname');
        footerLink.href = 'https://wiki.biligame.com/starengine/' + encodeURIComponent(mapName);
        footerLink.textContent = 'Wiki：' + mapName;
      }
    }

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mapname = button.getAttribute('data-mapname');
        if (!mapname || button.classList.contains('active')) return;
        loadAndShowMap(mapname, button);
      });
    });

    // 默认加载第一个
    const firstButton = tabButtons[0];
    if (firstButton) {
      const firstMapName = firstButton.getAttribute('data-mapname');
      if (firstMapName) {
        loadAndShowMap(firstMapName, firstButton);
      }
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapSwitcher);
  } else {
    initMapSwitcher();
  }
})();