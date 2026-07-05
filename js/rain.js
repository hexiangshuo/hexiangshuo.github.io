// source/js/rain.js — 圆形雨滴 + 渐细渐变尾巴（重力、平滑阵风、后台降帧）
(function() {
    // ===== 配置参数 =====
    var CONFIG = {
        // ----- 基础数量 -----
        count: 150,                 // 雨滴总数

        // ----- 雨滴大小 -----
        radius: 0.50,               // 基础半径（px）

        // ----- 物理参数 -----
        gravity: 0.08,              // 重力加速度（每帧增加下落速度）
        baseWind: 0.0,              // 基础水平风速（正数向右）
        gustStrength: 1.0,          // 最大阵风强度（风力范围 -gustStrength ~ +gustStrength）

        // ----- 颜色配置 -----
        r: 150,                     // 红色分量 (0-255)
        g: 180,                     // 绿色分量
        b: 255,                     // 蓝色分量
        maxOpacity: 0.1,            // 雨滴最大不透明度
        tailStartAlpha: 0.02,       // 拖尾尾部透明度（接近0则消失）

        // ----- 随机变化 -----
        sizeVariation: 2,           // 大小随机变化范围
        turbulence: 0.2,            // 随机扰动幅度（晃动）

        // ----- 拖尾 -----
        tailLength: 20,             // 拖尾长度（px）
        tailWidth: 2.0,             // 拖尾头部宽度（半径倍数）
    };

    // ===== 阵风状态 =====
    var currentWind = 0;            // 当前实际风力（平滑过渡中）
    var targetWind = 0;             // 目标风力（平滑逼近的目标值）
    var lastGustTime = 0;           // 上次切换阵风的时间戳（毫秒）
    var nextGustInterval = 4000;    // 下次切换的间隔（毫秒）

    // ===== 颜色工具 =====
    function makeColor(alpha) {
        return 'rgba(' + CONFIG.r + ',' + CONFIG.g + ',' + CONFIG.b + ',' + alpha + ')';
    }

    // ===== Canvas 初始化 =====
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

    // ===== 尺寸更新 =====
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    // ===== 创建单颗雨滴（分层） =====
    function createRaindrop() {
        var layer = Math.random();
        var radius, speed, opacityBase;
        if (layer < 0.2) {          // 近景（20%）：大、快、不透明
            radius = CONFIG.radius + 1.0 + Math.random() * 1.0;
            speed = 12 + Math.random() * 6;
            opacityBase = 0.7 + Math.random() * 0.3;
        } else if (layer < 0.7) {   // 中景（50%）：中等
            radius = CONFIG.radius + 0.5 + Math.random() * 0.8;
            speed = 8 + Math.random() * 4;
            opacityBase = 0.4 + Math.random() * 0.4;
        } else {                    // 远景（30%）：小、慢、透明
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

    // ===== 阵风更新（基于时间 + 平滑过渡） =====
    function updateWind() {
        var now = performance.now();
        // 如果到达切换时间
        if (now - lastGustTime >= nextGustInterval) {
            // 随机决定新目标风力（50%概率起风）
            if (Math.random() < 0.50) {
                targetWind = (Math.random() - 0.5) * 2 * CONFIG.gustStrength;
            } else {
                targetWind = 0;
            }
            lastGustTime = now;
            // 随机生成下次间隔（3000~8000ms）
            nextGustInterval = 3000 + Math.random() * 5000;
        }

        // 平滑过渡：每帧向目标靠近 2%（0.02）
        currentWind += (targetWind - currentWind) * 0.02;
        // 避免浮点误差导致无限接近但不完全到达
        if (Math.abs(currentWind - targetWind) < 0.001) {
            currentWind = targetWind;
        }
    }

    // ===== 绘制循环 =====
    function drawRain() {
        // 后台降帧：页面隐藏时不绘制，但仍更新位置（节省性能）
        if (!isPaused) {
            ctx.clearRect(0, 0, width, height);
        }

        // 更新风力（始终更新，不受暂停影响）
        updateWind();

        for (var i = 0; i < raindrops.length; i++) {
            var drop = raindrops[i];

            // 重力加速
            drop.verticalSpeed += CONFIG.gravity;

            // 随机扰动
            drop.vx += (Math.random() - 0.5) * CONFIG.turbulence * 0.2;
            drop.vy += (Math.random() - 0.5) * CONFIG.turbulence * 0.2;
            drop.vx = Math.max(-0.5, Math.min(0.5, drop.vx));
            drop.vy = Math.max(-0.3, Math.min(0.3, drop.vy));

            // 总水平速度 = 基础风 + 当前阵风 + 扰动
            var totalWind = drop.baseWind + currentWind;
            drop.x += totalWind + drop.vx;
            drop.y += drop.verticalSpeed + drop.vy;

            // 边界重置
            if (drop.y > height) {
                raindrops[i] = createRaindrop();
                raindrops[i].y = -10;
                continue;
            }
            if (drop.x > width) drop.x = 0;
            if (drop.x < 0) drop.x = width;

            // 如果页面隐藏，跳过绘制
            if (isPaused) continue;

            // ===== 绘制 =====
            var finalAlpha = CONFIG.maxOpacity * drop.opacity;

            // 尾巴（四边形）
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

            // 头部圆形
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            ctx.fillStyle = makeColor(finalAlpha);
            ctx.fill();
        }

        animId = requestAnimationFrame(drawRain);
    }

    // ===== 启动 =====
    function start() {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        resize();
        initRaindrops();
        // 初始化阵风时间
        lastGustTime = performance.now();
        targetWind = 0;
        currentWind = 0;
        drawRain();
    }

    // ===== 页面可见性监听（后台降帧） =====
    document.addEventListener('visibilitychange', function() {
        isPaused = document.hidden;
    });

    // ===== 启动 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();