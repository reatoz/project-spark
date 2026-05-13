/*
 * MIT License
 *
 * Copyright (c) [2026] [Doom]
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * 项目来源：BASpark (https://github.com/DoomVoss/BASpark)
 */
(function() {
    // 配置参数（可自行调整）
    const cfg = {
        color: 'rgba(87, 164, 255, 1)',
        trailColor: null,
        baseColor: null,
        scale: 1.5,
        opacityMul: 1.0,
        speed: 1.0,
        maxTrail: 12,
        alwaysTrail: false,
        fpsLimit: 60
    };

    // 辅助函数
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function parseColor(input) {
        const s = String(input || '').trim().replace(/^#/, '');
        if (/^[0-9a-fA-F]{3,8}$/.test(s)) {
            if (s.length === 3 || s.length === 4) {
                return `${parseInt(s[0]+s[0],16)},${parseInt(s[1]+s[1],16)},${parseInt(s[2]+s[2],16)}`;
            } else if (s.length === 6 || s.length === 8) {
                return `${parseInt(s.slice(0,2),16)},${parseInt(s.slice(2,4),16)},${parseInt(s.slice(4,6),16)}`;
            }
        }
        const d = document.createElement('div');
        d.style.display = 'none'; d.style.color = input;
        document.body.appendChild(d);
        const comp = window.getComputedStyle(d).color;
        document.body.removeChild(d);
        const m = comp.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        return m ? `${m[1]},${m[2]},${m[3]}` : '87,164,255';
    }

    // ========== BASparkLite 类 ==========
    class BASparkLite {
        constructor() {
            this.waves = [];
            this.sparks = [];
            this.pointerStates = new Map();
            this.lastFrameTime = performance.now();
            this.color = '87,164,255';
            this._lastColor = null;
            requestAnimationFrame((now) => this.loop(now));
        }
        syncOptions() {
            if (this._lastColor !== cfg.color || this._lastTrailColor !== cfg.trailColor || this._lastBaseColor !== cfg.baseColor) {
                this.color = parseColor(cfg.color);
                this.trailColor = cfg.trailColor ? parseColor(cfg.trailColor) : this.color;
                this.baseColor = cfg.baseColor ? parseColor(cfg.baseColor) : this.color;
                this._lastColor = cfg.color;
                this._lastTrailColor = cfg.trailColor;
                this._lastBaseColor = cfg.baseColor;
            }
            this.scale = clamp(Number(cfg.scale) || 1.5, 0.5, 3.0);
            this.opacityMul = clamp(Number(cfg.opacityMul) || 1.0, 0.1, 1.0);
            this.speed = clamp(Number(cfg.speed) || 1.0, 0.2, 3.0);
            this.maxTrail = clamp(Math.trunc(Number(cfg.maxTrail) || 12), 4, 32);
            this.alwaysTrail = Boolean(cfg.alwaysTrail);
            this.fpsLimit = Math.max(0, Math.trunc(Number(cfg.fpsLimit) || 0));
        }
        feed(pointerId, x, y, pressed) {
            this.syncOptions();
            let state = this.pointerStates.get(pointerId);
            if (!state) {
                state = { isDown: false, lastPos: null, trail: [] };
                this.pointerStates.set(pointerId, state);
            }
            if (pressed && !state.isDown) {
                state.lastPos = { x, y };
                this.boom(x, y);
            }
            if (!pressed && !this.alwaysTrail) {
                state.isDown = false;
                state.lastPos = null;
                return;
            }
            const p = { x, y };
            if (!state.lastPos) state.lastPos = p;
            const pointerCount = this.pointerStates.size;
            const minDist = 2 * Math.max(1, pointerCount / 2);
            const maxLen = Math.max(4, Math.floor(this.maxTrail / Math.max(1, pointerCount / 2)));
            if (Math.hypot(p.x - state.lastPos.x, p.y - state.lastPos.y) > minDist) {
                state.trail.push({ x: p.x, y: p.y, life: 1 });
                while (state.trail.length > maxLen) state.trail.shift();
                state.lastPos = p;
            }
            state.isDown = pressed;
        }
        drawTaperedArc(cx, cy, radius, start, end, maxWidth, alpha) {
            const sweep = end - start;
            if (sweep <= 0 || alpha <= 0 || maxWidth <= 0) return;
            const steps = Math.max(10, Math.ceil(Math.abs(sweep) / (Math.PI / 36)));
            const tipWidth = Math.max(0.12, maxWidth * 0.10);
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const t = i / steps, ang = start + sweep * t;
                const taper = Math.pow(Math.sin(Math.PI * t), 0.75);
                const w = Math.max(tipWidth, maxWidth * taper);
                const rOuter = radius + w * 0.5;
                if (i === 0) ctx.moveTo(cx + Math.cos(ang) * rOuter, cy + Math.sin(ang) * rOuter);
                else ctx.lineTo(cx + Math.cos(ang) * rOuter, cy + Math.sin(ang) * rOuter);
            }
            for (let i = steps; i >= 0; i--) {
                const t = i / steps, ang = start + sweep * t;
                const taper = Math.pow(Math.sin(Math.PI * t), 0.75);
                const w = Math.max(tipWidth, maxWidth * taper);
                const rInner = Math.max(0.01, radius - w * 0.5);
                ctx.lineTo(cx + Math.cos(ang) * rInner, cy + Math.sin(ang) * rInner);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(255,255,255,${clamp(alpha * this.opacityMul, 0, 1)})`;
            ctx.fill();
        }
        boom(x, y) {
            const segs = [];
            for (let i = 0; i < 3; i++) segs.push({ off: Math.random() * Math.PI * 2, len: (1.2 + Math.random() * 0.14) * Math.PI });
            this.waves.push({ x, y, life: 0, max: 17, r: 0, ring: { segs, ang: Math.random() * Math.PI * 2, life: 0, maxLife: 32 } });
            for (let i = 0; i < 3; i++) {
                const a = Math.random() * Math.PI * 2, speed = (2 + Math.random()) * this.scale / 1.5;
                this.sparks.push({
                    x: x + Math.cos(a) * 8 * this.scale, y: y + Math.sin(a) * 8 * this.scale,
                    vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
                    s: (6 + Math.random() * 6) * this.scale * 1.3, a: 1, up: Math.random() < 0.5
                });
            }
        }
        loop(now) {
            this.syncOptions();
            const elapsed = now - this.lastFrameTime;
            if (this.fpsLimit > 0 && elapsed < (1000 / this.fpsLimit) - 1) {
                requestAnimationFrame((nextNow) => this.loop(nextNow));
                return;
            }
            const deltaMs = Math.min(elapsed, 250);
            this.lastFrameTime = now;
            const frameScale = (deltaMs / 16.67) * this.speed;
            const hasPointerTrails = this.pointerStates.size > 0;
            if (this.waves.length > 0 || this.sparks.length > 0 || hasPointerTrails) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const trailC = this.trailColor || '255,255,255';
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                for (const [pointerId, state] of this.pointerStates) {
                    const trail = state.trail;
                    const decayRate = (this.alwaysTrail ? 0.085 : (state.isDown ? 0.085 : 0.18)) * frameScale;
                    for (let i = trail.length - 1; i >= 0; i--) {
                        trail[i].life -= decayRate;
                        if (trail[i].life <= 0) trail.splice(i, 1);
                    }
                    if (trail.length > 1) {
                        const len = trail.length - 1;
                        for (let i = 1; i < trail.length; i++) {
                            ctx.lineWidth = 3 * this.scale * (i / len);
                            ctx.beginPath();
                            ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
                            ctx.lineTo(trail[i].x, trail[i].y);
                            ctx.strokeStyle = `rgba(${trailC},1)`;
                            ctx.stroke();
                        }
                    }
                    if (!state.isDown && trail.length === 0) this.pointerStates.delete(pointerId);
                }
                for (let i = this.waves.length - 1; i >= 0; i--) {
                    const w = this.waves[i];
                    w.life += frameScale;
                    const progress = w.life / w.max, ease = 1 - Math.pow(1 - Math.min(progress, 1), 3);
                    w.r = 26 * this.scale * ease;
                    const alpha = Math.max(0, 1 - Math.min(1, progress * 0.9));
                    if (alpha > 0) {
                        const baseCol = this.baseColor || this.color;
                        ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 1.1, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${baseCol},${clamp(alpha * this.opacityMul, 0, 1)})`; ctx.fill();
                    }
                    const r = w.ring; r.life += frameScale;
                    const ringProg = Math.min(r.life / r.maxLife, 1), ringEase = Math.pow(ringProg, 1.4);
                    r.ang -= 0.08 * frameScale;
                    for (let j = 0; j < r.segs.length; j++) {
                        const seg = r.segs[j], shrink = Math.max(0, 1 - ringEase);
                        const len = seg.len * shrink, start = r.ang + seg.off;
                        const ringAlpha = Math.min(1, (1 - ringEase) * 1.12 + 0.45);
                        this.drawTaperedArc(w.x, w.y, w.r + 3 * this.scale, start, start + len, 2 * this.scale, ringAlpha);
                    }
                    if (progress >= 1 && ringProg >= 1) this.waves.splice(i, 1);
                }
                const trailCol = this.trailColor || '255,255,255';
                for (let i = this.sparks.length - 1; i >= 0; i--) {
                    const s = this.sparks[i];
                    s.x += s.vx * frameScale; s.y += s.vy * frameScale;
                    s.vx *= Math.pow(0.92, frameScale); s.vy *= Math.pow(0.92, frameScale);
                    s.s *= Math.pow(0.95, frameScale);
                    s.a -= 0.019 * frameScale;
                    if (s.a <= 0 || s.s <= 0.5) { this.sparks.splice(i, 1); continue; }
                    const h = s.s * 0.866;
                    ctx.beginPath();
                    if (s.up) {
                        ctx.moveTo(s.x, s.y - h * 0.67);
                        ctx.lineTo(s.x - s.s * 0.5, s.y + h * 0.33);
                        ctx.lineTo(s.x + s.s * 0.5, s.y + h * 0.33);
                    } else {
                        ctx.moveTo(s.x, s.y + h * 0.67);
                        ctx.lineTo(s.x - s.s * 0.5, s.y - h * 0.33);
                        ctx.lineTo(s.x + s.s * 0.5, s.y - h * 0.33);
                    }
                    ctx.closePath();
                    ctx.fillStyle = `rgba(${trailCol},${clamp(s.a * this.opacityMul, 0, 1)})`;
                    ctx.fill();
                }
            }
            requestAnimationFrame((nextNow) => this.loop(nextNow));
        }
    }

    // ========== 初始化，不拦截事件 ==========
    let canvas, ctx;
    let spark;
    let mousePressed = false;

    function init() {
        // 创建 canvas，设置为 pointer-events: none，让鼠标事件穿透
        canvas = document.createElement('canvas');
        canvas.id = 'sparkCanvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';  
        canvas.style.zIndex = '99999';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        spark = new BASparkLite();

        // 全局监听鼠标位置（只记录坐标，不拦截事件）
        let currentX = 0, currentY = 0;
        window.addEventListener('mousemove', (e) => {
            currentX = e.clientX;
            currentY = e.clientY;
            if (mousePressed) {
                spark.feed(0, currentX, currentY, true);
            }
        });
        window.addEventListener('mousedown', (e) => {
            mousePressed = true;
            spark.feed(0, currentX, currentY, true);
        });
        window.addEventListener('mouseup', () => {
            mousePressed = false;
            spark.feed(0, 0, 0, false);
        });

        // 触摸事件
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length) {
                const touch = e.touches[0];
                currentX = touch.clientX;
                currentY = touch.clientY;
                if (mousePressed) {
                    spark.feed(0, currentX, currentY, true);
                }
            }
        });
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length) {
                const touch = e.touches[0];
                currentX = touch.clientX;
                currentY = touch.clientY;
                mousePressed = true;
                spark.feed(0, currentX, currentY, true);
            }
            e.preventDefault(); // 避免页面滚动，但不会影响下方点击？
        });
        window.addEventListener('touchend', () => {
            mousePressed = false;
            spark.feed(0, 0, 0, false);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();