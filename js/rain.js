// source/js/rain.js — 圆形雨滴 + 渐细渐变尾巴（颜色统一，拖尾尾部更透明）
(function() {
    var CONFIG = {
        count: 120,                 // 雨滴数量
        speed: 10,                   // 基础下落速度
        radius: 0.50,               // 雨滴半径
        // ----- 颜色配置（替换原 color 字符串） -----
        r: 150,                     // 红色分量 (0-255)
        g: 180,                     // 绿色分量
        b: 255,                     // 蓝色分量
        maxOpacity: 0.1,            // 雨滴头部最大不透明度 (0~1)
        tailStartAlpha: 0.02,       // 拖尾尾部透明度 (比头部更透明，0为完全透明)
        // ------------------------------------------
        wind: 0,                    // 基础水平飘移
        sizeVariation: 2,           // 大小随机变化范围
        turbulence: 0.2,            // 扰动幅度
        tailLength: 20,             // 尾巴长度（像素）
        tailWidth: 2.0,             // 尾巴头部宽度（相对于雨滴半径的倍数）
    };

    // 统一生成 rgba 颜色的函数
    function makeColor(alpha) {
        return 'rgba(' + CONFIG.r + ',' + CONFIG.g + ',' + CONFIG.b + ',' + alpha + ')';
    }

    var canvas = document.createElement('canvas');
    canvas.id = 'rain-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        background: transparent;
    `;
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var width, height;
    var raindrops = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    function createRaindrop() {
        return {
            x: Math.random() * width,
            y: Math.random() * height - height,
            radius: CONFIG.radius + Math.random() * CONFIG.sizeVariation,
            speed: CONFIG.speed + Math.random() * 1.5,
            wind: CONFIG.wind + (Math.random() - 0.5) * 0.5,
            opacity: 0.5 + Math.random() * 0.5,   // 0.5~1.0
            tailLength: CONFIG.tailLength + Math.random() * 8,
            vx: 0,
            vy: 0,
        };
    }

    function initRaindrops() {
        raindrops = [];
        for (var i = 0; i < CONFIG.count; i++) {
            raindrops.push(createRaindrop());
        }
    }

    function drawRain() {
        ctx.clearRect(0, 0, width, height);

        for (var i = 0; i < raindrops.length; i++) {
            var drop = raindrops[i];

            // 随机扰动
            drop.vx += (Math.random() - 0.5) * CONFIG.turbulence * 0.2;
            drop.vy += (Math.random() - 0.5) * CONFIG.turbulence * 0.2;
            drop.vx = Math.max(-0.5, Math.min(0.5, drop.vx));
            drop.vy = Math.max(-0.3, Math.min(0.3, drop.vy));

            drop.x += drop.wind + drop.vx;
            drop.y += drop.speed + drop.vy;

            if (drop.y > height) {
                raindrops[i] = createRaindrop();
                raindrops[i].y = -10;
                continue;
            }
            if (drop.x > width) drop.x = 0;
            if (drop.x < 0) drop.x = width;

            // ===== 计算当前雨滴的最终透明度 =====
            var finalAlpha = CONFIG.maxOpacity * drop.opacity;

            // ===== 绘制尾巴（四边形） =====
            var tailLen = drop.tailLength;
            var startX = drop.x - drop.wind * 0.3;
            var startY = drop.y - tailLen;
            var endX = drop.x;
            var endY = drop.y;

            var headWidth = drop.radius * CONFIG.tailWidth;
            var tailWidth = 0;

            // 颜色渐变：尾部透明度为 CONFIG.tailStartAlpha（略高于0），头部为 finalAlpha
            var gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, makeColor(CONFIG.tailStartAlpha));
            gradient.addColorStop(1, makeColor(finalAlpha * 1.2));

            var halfHead = headWidth / 2;
            var halfTail = tailWidth / 2;

            ctx.beginPath();
            ctx.moveTo(startX - halfTail, startY);
            ctx.lineTo(startX + halfTail, startY);
            ctx.lineTo(endX + halfHead, endY);
            ctx.lineTo(endX - halfHead, endY);
            ctx.closePath();

            ctx.fillStyle = gradient;
            ctx.fill();

            // ===== 绘制头部圆形雨滴 =====
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            ctx.fillStyle = makeColor(finalAlpha);
            ctx.fill();
        }

        requestAnimationFrame(drawRain);
    }

    function start() {
        resize();
        initRaindrops();
        drawRain();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();