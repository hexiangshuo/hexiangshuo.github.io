// ============================================================
//  配置区域（可自由调整）
//  说明：所有可调参数集中在此，修改后无需改动下方逻辑
// ============================================================
!function() {
    // ---------- 默认配置 ----------
    const C = {
        // ----- 基础 -----
        zIndex: -1,                 // 画布层叠顺序（-1 在内容后方）
        opacity: 0.6,               // 画布整体透明度（0~1）

        // ----- 颜色 -----
        dotColor: '100,120,155',    // 粒子点颜色（R,G,B），固定不变
        lineColor: '80,100,115',    // 连线基础颜色（R,G,B），参与渐变

        // ----- 粒子数量 -----
        count: 200,                 // 初始粒子数（实际会根据屏幕密度动态调整）
        density: 0.00012,           // 粒子密度（每平方像素数量，值越大越密）
        maxParticles: 350,          // 最大粒子数（性能保护）
        minParticles: 30,           // 最小粒子数（保证效果）

        // ----- 物理参数 -----
        speedScale: 2,              // 初始速度缩放（值越大粒子移动越快）
        lerpFactor: 0.02,           // 连线距离平滑速度（0~1，越小过渡越慢）
        attractStrength: 0.05,      // 鼠标吸引强度（值越大粒子越跟手）
        dampingBase: 0.2,           // 速度阻尼基础值（0~1，越大减速越快）
        recoveryFactor: 0.02,       // 速度恢复速率（粒子减速后恢复速度的快慢）

        // ----- 连线样式 -----
        particleMax: 10000,         // 粒子间连线最大距离（平方值，实际约√10000=100px）
        mouseMax: 30000,            // 鼠标与粒子连线最大距离（平方值，实际约√30000≈173px）
        lineWidthBase: 0.3,         // 连线宽度系数（值越大线条越粗）
        alphaExponent: 1.5,         // 透明度衰减指数（值越大远距离线条淡出越快）

        // ----- 点击爆发 -----
        burstForce: 8,              // 爆发力度（值越大粒子飞得越远）
        burstRadius: 150,           // 爆发影响半径（px）

        // ----- 其他 -----
        gradient: true,             // 是否启用连线颜色渐变（true=渐变，false=纯色）
    };

    // ---------- 从 <script> 标签读取自定义参数 ----------
    const scripts = document.getElementsByTagName('script');
    const lastScript = scripts[scripts.length - 1];
    const getAttr = (attr, def) => {
        const val = lastScript.getAttribute(attr);
        if (val === null) return def;
        const num = parseFloat(val);
        return isNaN(num) ? def : num;
    };
    const getStr = (attr, def) => lastScript.getAttribute(attr) || def;

    const config = {
        zIndex: getAttr('zIndex', C.zIndex),
        opacity: getAttr('opacity', C.opacity),
        dotColor: getStr('dotColor', C.dotColor),
        lineColor: getStr('lineColor', C.lineColor),
        count: getAttr('count', C.count),
        gradient: getStr('gradient', 'true') === 'true',
        particleMax: getAttr('particleMax', C.particleMax),
        mouseMax: getAttr('mouseMax', C.mouseMax),
        density: C.density,
        maxParticles: C.maxParticles,
        minParticles: C.minParticles,
        speedScale: C.speedScale,
        lerpFactor: C.lerpFactor,
        attractStrength: C.attractStrength,
        dampingBase: C.dampingBase,
        recoveryFactor: C.recoveryFactor,
        lineWidthBase: C.lineWidthBase,
        alphaExponent: C.alphaExponent,
        burstForce: C.burstForce,
        burstRadius: C.burstRadius
    };

    // ===== Canvas 初始化 =====
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], mouse = { x: null, y: null, max: config.mouseMax };
    let paused = false, time = 0, animId = null;

    // ===== 尺寸更新 =====
    const updateSize = () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', updateSize);

    // ===== 粒子生成 =====
    const createParticle = () => {
        const a = config.speedScale * (2 * Math.random() - 1);
        const b = config.speedScale * (2 * Math.random() - 1);
        return {
            x: Math.random() * W, y: Math.random() * H,
            vx: a, vy: b,
            max: config.particleMax, baseMax: config.particleMax,
            scale: 1, initSpeed: Math.sqrt(a * a + b * b),
            ignoreMouse: false      // 新增：是否忽略鼠标吸引
        };
    };

    const initParticles = () => {
        const area = W * H;
        const density = config.density;
        let count = Math.round(area * density);
        count = Math.min(config.maxParticles, Math.max(config.minParticles, count));
        particles = Array.from({ length: count }, createParticle);
    };

    // ===== 点击爆发 =====
    const burst = (cx, cy) => {
        const force = config.burstForce, radius = config.burstRadius;
        for (const p of particles) {
            const dx = p.x - cx, dy = p.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) {
                const strength = force * (1 - dist / radius);
                const angle = Math.atan2(dy, dx) + (Math.random() - .5) * .5;
                p.vx += Math.cos(angle) * strength;
                p.vy += Math.sin(angle) * strength;
                // 爆发后立即脱离鼠标控制
                p.ignoreMouse = true;
            }
        }
    };
    document.addEventListener('click', e => burst(e.clientX, e.clientY));

    // ===== 鼠标移动事件（恢复粒子控制权） =====
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        // 移动鼠标时，让所有粒子重新接受吸引
        for (const p of particles) {
            p.ignoreMouse = false;
        }
    });

    // ===== 颜色工具 =====
    const dotCol = config.dotColor.split(',').map(Number);
    const lineCol = config.lineColor.split(',').map(Number);
    const makeColor = (base, alpha) => `rgba(${base[0]},${base[1]},${base[2]},${alpha})`;

    // ===== 绘制循环 =====
    const draw = () => {
        if (paused) { animId = requestAnimationFrame(draw); return; }
        ctx.clearRect(0, 0, W, H);
        time += 0.005;

        const all = [mouse, ...particles];
        const { particleMax, mouseMax, lerpFactor, attractStrength, dampingBase,
                recoveryFactor, lineWidthBase, alphaExponent } = config;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            // 位置更新
            p.x += p.vx; p.y += p.vy;
            if (p.x > W || p.x < 0) p.vx *= -1;
            if (p.y > H || p.y < 0) p.vy *= -1;

            // 动态连线距离
            let targetScale = 1;
            if (mouse.x !== null && !p.ignoreMouse) {   // 忽略鼠标时，不调整连线距离
                const dx = p.x - mouse.x, dy = p.y - mouse.y;
                const dsq = dx * dx + dy * dy;
                if (dsq < mouseMax) {
                    const ratio = Math.sqrt(dsq / mouseMax);
                    targetScale = .2 + .8 * ratio;
                }
            }
            p.scale += (targetScale - p.scale) * lerpFactor;
            p.scale = Math.max(.2, Math.min(1, p.scale));
            p.max = p.baseMax * p.scale;

            // 绘制粒子点（圆形）
            ctx.beginPath();
            ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
            ctx.fillStyle = makeColor(dotCol, .9);
            ctx.fill();

            // 连线
            for (let j = 0; j < all.length; j++) {
                const other = all[j];
                if (other === p || other.x === null) continue;
                const dx = p.x - other.x, dy = p.y - other.y;
                const dsq = dx * dx + dy * dy;
                const maxD = other.max || particleMax;
                if (dsq < maxD && dsq > 0.01) {
                    const dist = Math.sqrt(dsq);
                    const maxDist = Math.sqrt(maxD);
                    // 指数衰减透明度
                    const alpha = Math.pow(1 - dist / maxDist, alphaExponent);
                    const clamped = Math.min(1, Math.max(0, alpha));

                    // 鼠标吸引（只有未被忽略时才生效）
                    if (other === mouse && !p.ignoreMouse) {
                        const ratio = dist / maxDist;
                        if (ratio < 1 && dist > 100) {
                            const strength = attractStrength * (1 - ratio);
                            p.x -= strength * dx;
                            p.y -= strength * dy;
                        }
                        const radial = (p.vx * dx + p.vy * dy) / dist;
                        if (radial > 0) {
                            const damp = dampingBase + .8 * (1 - ratio);
                            const newR = radial * damp;
                            p.vx += (newR - radial) * dx / dist;
                            p.vy += (newR - radial) * dy / dist;
                        }
                    }

                    // 连线颜色
                    let r, g, b;
                    if (config.gradient) {
                        const off = 50 * Math.sin(time * .8 + j * .2);
                        r = Math.min(255, Math.max(0, lineCol[0] + off * .3));
                        g = Math.min(255, Math.max(0, lineCol[1] + off * .5));
                        b = Math.min(255, Math.max(0, lineCol[2] + off * .7));
                    } else {
                        [r, g, b] = lineCol;
                    }
                    ctx.beginPath();
                    ctx.lineWidth = Math.max(.3, clamped * lineWidthBase);
                    ctx.strokeStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${clamped})`;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }

            // 速度恢复
            const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const target = p.initSpeed;
            if (spd < target && spd > 0) {
                const angle = Math.atan2(p.vy, p.vx) + (Math.random() - .5) * .5;
                p.vx += recoveryFactor * Math.cos(angle) * target;
                p.vy += recoveryFactor * Math.sin(angle) * target;
            } else if (spd > target * 1.5) {
                p.vx *= .999;
                p.vy *= .999;
            }
        }
        animId = requestAnimationFrame(draw);
    };

    // ===== 启动 =====
    const start = () => {
        if (animId) cancelAnimationFrame(animId);
        updateSize();
        initParticles();
        setTimeout(draw, 100);
    };

    const debounce = (fn, delay) => {
        let timer;
        return () => { clearTimeout(timer); timer = setTimeout(fn, delay); };
    };
    window.addEventListener('resize', debounce(() => { updateSize(); initParticles(); }, 200));
    document.addEventListener('visibilitychange', () => paused = document.hidden);
    window.addEventListener('mouseout', () => { mouse.x = null; });

    // ===== 插入 Canvas =====
    canvas.style.cssText = `position:fixed;top:0;left:0;z-index:${config.zIndex};opacity:${config.opacity};pointer-events:none;`;
    canvas.id = 'c_n_' + document.getElementsByTagName('script').length;
    document.body.appendChild(canvas);
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
}();