// source/js/rain.js — 圆形雨滴 + 渐细渐变尾巴（适合图片背景）
(function() {
    var CONFIG = {
        count: 100,                 // 雨滴数量
        speed: 10,                   // 基础下落速度
        radius: 0.75,                // 雨滴半径
        color: 'rgba(150, 180, 255, 0.2)',
        wind: 0,                  // 基础水平飘移
        sizeVariation: 2,           // 大小随机变化范围
        turbulence: 0.2,           // 扰动幅度
        tailLength: 20,             // 尾巴长度（像素）
        tailWidth: 2.0,             // 尾巴头部宽度（相对于雨滴半径的倍数）
    };

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
            opacity: 0.5 + Math.random() * 0.5,
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

            // ===== 绘制尾巴（四边形，宽度从尾部（细）渐变到头部（粗）） =====
            var tailLen = drop.tailLength;
            // 尾巴的起点（尾部，上方）和终点（头部，下方）
            var startX = drop.x - drop.wind * 0.3;
            var startY = drop.y - tailLen;
            var endX = drop.x;
            var endY = drop.y;

            // 头部宽度（粗），尾部宽度为0
            var headWidth = drop.radius * CONFIG.tailWidth;
            var tailWidth = 0;

            // 构造四边形路径：从尾部左上 -> 尾部右上 -> 头部右上 -> 头部左上
            // 由于我们要渐变透明度，用 fillRect 或自定义形状并用渐变色填充
            // 更精确：使用路径 + fill，并设置渐变色
            var gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            // 尾部完全透明，头部不透明
            var baseColor = CONFIG.color.replace('0.8', '0');
            var headColor = CONFIG.color.replace('0.8', drop.opacity);
            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(1, headColor);

            // 计算四边形四个角
            // 尾部（宽度0）的点就是 (startX, startY)
            // 头部两点：左右偏移 headWidth/2
            var halfHead = headWidth / 2;
            var halfTail = tailWidth / 2; // 0

            ctx.beginPath();
            // 从尾部开始（由于宽度为0，两点重合）
            ctx.moveTo(startX - halfTail, startY);
            ctx.lineTo(startX + halfTail, startY);
            // 到头部右侧
            ctx.lineTo(endX + halfHead, endY);
            // 到头部左侧
            ctx.lineTo(endX - halfHead, endY);
            ctx.closePath();

            ctx.fillStyle = gradient;
            ctx.fill();

            // ===== 绘制头部雨滴（圆形，更亮） =====
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            ctx.fillStyle = CONFIG.color.replace('0.8', drop.opacity);
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