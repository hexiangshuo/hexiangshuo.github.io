// source/js/trail-particles.js
(function() {
    'use strict';

    // ===== 配置 =====
    const CONFIG = {
        maxParticles: 30,
        particleSize: 5,
        speed: 0.04,
        color: '140, 180, 210',      // 深蓝灰
        alpha: 0.5,                // 透明度
        randomHue: 5,
        spread: 1.5,
    };

    let particles = [];
    let mouseX = 0, mouseY = 0;
    let lastMouseX = 0, lastMouseY = 0;
    let frameId = null;
    let isMouseMoving = false;
    let moveTimeout = null;

    // ---- 预解析颜色分量（关键修复） ----
    const baseColor = CONFIG.color.split(',').map(Number);

    function createParticle(x, y) {
        const size = CONFIG.particleSize * (0.3 + Math.random() * 0.7);
        const hueShift = (Math.random() - 0.5) * CONFIG.randomHue;

        // ---- 正确计算 RGB ----
        const r = Math.min(255, Math.max(0, baseColor[0] + hueShift));
        const g = Math.min(255, Math.max(0, baseColor[1] + hueShift * 0.5));
        const b = Math.min(255, Math.max(0, baseColor[2] + hueShift * 0.3));
        const color = `rgba(${r}, ${g}, ${b}, ${CONFIG.alpha})`;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * CONFIG.spread;
        return {
            x: x,
            y: y,
            size: size,
            color: color,
            life: 1.0,
            speed: CONFIG.speed * (0.6 + Math.random() * 0.8),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.3,
        };
    }

    function updateParticles() {
        if (isMouseMoving && particles.length < CONFIG.maxParticles) {
            const offsetX = (Math.random() - 0.5) * 3;
            const offsetY = (Math.random() - 0.5) * 3;
            particles.push(createParticle(mouseX + offsetX, mouseY + offsetY));
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= p.speed;
            p.size *= 0.98;
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;

            if (p.life <= 0 || p.size < 0.1) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
            const alpha = p.life * CONFIG.alpha;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.1, p.size), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    function animate() {
        const canvas = document.getElementById('trail-canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        }
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        updateParticles();
        drawParticles(ctx, rect.width, rect.height);

        frameId = requestAnimationFrame(animate);
    }

    function initCanvas() {
        if (document.getElementById('trail-canvas')) return;

        const canvas = document.createElement('canvas');
        canvas.id = 'trail-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(canvas);

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (mouseX !== lastMouseX || mouseY !== lastMouseY) {
                isMouseMoving = true;
                lastMouseX = mouseX;
                lastMouseY = mouseY;
                clearTimeout(moveTimeout);
                moveTimeout = setTimeout(() => {
                    isMouseMoving = false;
                }, 150);
            }
        });

        window.addEventListener('resize', () => {
            const canvas = document.getElementById('trail-canvas');
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
        });

        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCanvas);
    } else {
        initCanvas();
    }
})();