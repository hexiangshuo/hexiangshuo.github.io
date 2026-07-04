// source/js/rain.js — 圆形雨滴 + 渐细渐变尾巴（重力、阵风、后台降帧）
(function() {
    var CONFIG = {
        // ===== 基础数量 =====
        count: 150,                 // 雨滴总数量（粒子数）

        // ===== 雨滴大小 =====
        radius: 0.50,               // 雨滴基础半径（px），实际大小会在此基础上随机变化

        // ===== 物理参数 =====
        gravity: 0.08,              // 重力加速度（每帧增加下落速度），值越大下落越快
        baseWind: 0.0,              // 基础水平风速（正数向右飘，负数向左飘）
        gustStrength: 1.0,          // 阵风最大强度（实际风力在 -gustStrength ~ gustStrength 之间随机切换）

        // ===== 颜色配置 =====
        r: 150,                     // 红色分量 (0-255)
        g: 180,                     // 绿色分量 (0-255)
        b: 255,                     // 蓝色分量 (0-255)，当前为淡蓝色
        maxOpacity: 0.1,            // 雨滴最大不透明度（0~1），值越大雨滴越明显
        tailStartAlpha: 0.02,       // 拖尾尾部透明度（接近0则尾部几乎消失）

        // ===== 随机变化范围 =====
        sizeVariation: 2,           // 雨滴大小随机变化范围（radius ± sizeVariation）
        turbulence: 0.2,            // 随机扰动幅度（让雨滴路径更自然，值越大晃动越明显）

        // ===== 拖尾参数 =====
        tailLength: 20,             // 拖尾长度（像素），值越大尾巴越长
        tailWidth: 2.0,             // 拖尾头部宽度（相对于雨滴半径的倍数）
    };

    var currentWind = 0;
    var gustTimer = 0;

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
    var isPaused = false;
    var animId = null;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    function createRaindrop() {
        var layer = Math.random();
        var radius, speed, opacityBase;
        if (layer < 0.2) {
            radius = CONFIG.radius + 1.0 + Math.random() * 1.0;
            speed = 12 + Math.random() * 6;
            opacityBase = 0.7 + Math.random() * 0.3;
        } else if (layer < 0.7) {
            radius = CONFIG.radius + 0.5 + Math.random() * 0.8;
            speed = 8 + Math.random() * 4;
            opacityBase = 0.4 + Math.random() * 0.4;
        } else {
            radius = CONFIG.radius + 0.1 + Math.random() * 0.4;
            speed = 4 + Math.random() * 3;
            opacityBase = 0.2 + Math.random() * 0.3;
        }
        return {
            x: Math.random() * width,
            y: Math.random() * height - height,
            radius: radius,
            verticalSpeed: speed,
            baseWind: CONFIG.baseWind + (Math.random() - 0.5) * 0.5,
            opacity: opacityBase,
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

    function updateWind() {
        gustTimer++;
        if (gustTimer % 300 === 0) {
            if (Math.random() < 0.5) {
                currentWind = (Math.random() - 0.5) * 2 * CONFIG.gustStrength;
            } else {
                currentWind = 0;
            }
        }
    }

    // ===== 绘制函数（名称改为 drawRain） =====
    function drawRain() {
        if (!isPaused) {
            ctx.clearRect(0, 0, width, height);
        }

        updateWind();

        for (var i = 0; i < raindrops.length; i++) {
            var drop = raindrops[i];

            drop.verticalSpeed += CONFIG.gravity;

            drop.vx += (Math.random() - 0.5) * CONFIG.turbulence * 0.2;
            drop.vy += (Math.random() - 0.5) * CONFIG.turbulence * 0.2;
            drop.vx = Math.max(-0.5, Math.min(0.5, drop.vx));
            drop.vy = Math.max(-0.3, Math.min(0.3, drop.vy));

            var totalWind = drop.baseWind + currentWind;
            drop.x += totalWind + drop.vx;
            drop.y += drop.verticalSpeed + drop.vy;

            if (drop.y > height) {
                raindrops[i] = createRaindrop();
                raindrops[i].y = -10;
                continue;
            }
            if (drop.x > width) drop.x = 0;
            if (drop.x < 0) drop.x = width;

            if (isPaused) continue;

            var finalAlpha = CONFIG.maxOpacity * drop.opacity;

            var tailLen = drop.tailLength;
            var startX = drop.x - totalWind * 0.3;
            var startY = drop.y - tailLen;
            var endX = drop.x;
            var endY = drop.y;

            var headWidth = drop.radius * CONFIG.tailWidth;
            var tailWidth = 0;

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

            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            ctx.fillStyle = makeColor(finalAlpha);
            ctx.fill();
        }

        animId = requestAnimationFrame(drawRain);
    }

    function start() {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        resize();
        initRaindrops();
        drawRain();   // ← 修正：调用 drawRain 而不是 draw
    }

    document.addEventListener('visibilitychange', function() {
        isPaused = document.hidden;
    });

    window.addEventListener('resize', resize);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();