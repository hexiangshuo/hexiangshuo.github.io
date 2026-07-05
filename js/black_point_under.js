!function() {
    // ========== 工具函数 ==========
    function getAttrOrDefault(el, attr, def) {
        var val = el.getAttribute(attr);
        return val !== null ? val : def;
    }

    function getConfig() {
        var scripts = document.getElementsByTagName('script');
        var lastScript = scripts[scripts.length - 1];
        return {
            zIndex: parseInt(getAttrOrDefault(lastScript, 'zIndex', '-1'), 10),
            opacity: parseFloat(getAttrOrDefault(lastScript, 'opacity', '0.6')),
            // ----- 粒子点颜色（固定色，不参与渐变） -----
            dotColor: getAttrOrDefault(lastScript, 'dotColor', '100,120,155'),  // 亮蓝白
            // ----- 连线颜色（参与渐变） -----
            lineColor: getAttrOrDefault(lastScript, 'lineColor', '80,100,115'), // 灰蓝
            count: parseInt(getAttrOrDefault(lastScript, 'count', '200'), 10),
            gradient: getAttrOrDefault(lastScript, 'gradient', 'true') === 'true',
            particleMax: parseInt(getAttrOrDefault(lastScript, 'particleMax', '10000'), 10),
            mouseMax: parseInt(getAttrOrDefault(lastScript, 'mouseMax', '30000'), 10)
        };
    }

    // ========== 防抖函数 ==========
    function debounce(fn, delay) {
        var timer = null;
        return function() {
            var args = arguments;
            var context = this;
            clearTimeout(timer);
            timer = setTimeout(function() {
                fn.apply(context, args);
            }, delay);
        };
    }

    // ========== 配置与全局变量 ==========
    var config = getConfig();
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var width, height;
    var particles = [];
    var mouse = { x: null, y: null, max: config.mouseMax };
    var isPaused = false;
    var time = 0;
    var animId = null;

    // ========== 画布尺寸更新 ==========
    function updateSize() {
        width = canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        height = canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    }

    // ========== 粒子初始化 ==========
    function initParticles() {
        particles = [];
        // 动态调整粒子数量（根据屏幕面积）
        var area = width * height;
        var density = 0.00012;
        var actualCount = Math.min(350, Math.max(50, Math.round(area * density)));
        for (var i = 0; i < actualCount; i++) {
            var xa = 2 * (2 * Math.random() - 1);
            var ya = 2 * (2 * Math.random() - 1);
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                xa: xa,
                ya: ya,
                max: config.particleMax,
                baseMax: config.particleMax,
                currentScale: 1.0,
                initSpeed: Math.sqrt(xa * xa + ya * ya)
            });
        }
    }

    // ========== 绘制主循环 ==========
    function draw() {
        if (isPaused) {
            animId = requestAnimationFrame(draw);
            return;
        }

        ctx.clearRect(0, 0, width, height);
        time += 0.005;

        var allNodes = [mouse].concat(particles);

        // 解析颜色
        var dotColor = config.dotColor.split(',').map(Number);
        var lineBaseColor = config.lineColor.split(',').map(Number);

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // 更新位置
            p.x += p.xa;
            p.y += p.ya;

            // 边界反弹
            if (p.x > width || p.x < 0) p.xa *= -1;
            if (p.y > height || p.y < 0) p.ya *= -1;

            // ====== 动态调整粒子间连线距离（平滑过渡） ======
            var targetScale = 1.0;
            if (mouse.x !== null && mouse.y !== null) {
                var dxToMouse = p.x - mouse.x;
                var dyToMouse = p.y - mouse.y;
                var distToMouseSq = dxToMouse * dxToMouse + dyToMouse * dyToMouse;
                var maxMouseDistSq = config.mouseMax;
                if (distToMouseSq < maxMouseDistSq) {
                    var ratio = Math.sqrt(distToMouseSq) / Math.sqrt(maxMouseDistSq);
                    targetScale = 0.2 + 0.8 * ratio;
                }
            }

            var lerpFactor = 0.02;
            p.currentScale += (targetScale - p.currentScale) * lerpFactor;
            p.currentScale = Math.min(1.0, Math.max(0.2, p.currentScale));
            p.max = p.baseMax * p.currentScale;

            // ====== 绘制粒子点（使用 dotColor，固定透明度） ======
            ctx.fillStyle = 'rgba(' + dotColor[0] + ',' + dotColor[1] + ',' + dotColor[2] + ', 0.9)';
            ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);

            // 遍历其他节点（鼠标 + 其他粒子）
            for (var j = 0; j < allNodes.length; j++) {
                var other = allNodes[j];
                if (other === p) continue;
                if (other.x === null || other.y === null) continue;

                var dx = p.x - other.x;
                var dy = p.y - other.y;
                var distSq = dx * dx + dy * dy;
                var maxDistSq = other.max || config.particleMax;

                if (distSq < maxDistSq && distSq > 0.01) {
                    var dist = Math.sqrt(distSq);
                    var maxDist = Math.sqrt(maxDistSq);
                    var alpha = (maxDist - dist) / maxDist;
                    alpha = Math.min(1, Math.max(0, alpha));

                    // ====== 鼠标吸引 ======
                    if (other === mouse && distSq > 0) {
                        var ratio = dist / maxDist;
                        if (ratio < 1 && dist > 100) {
                            var attractStrength = 0.05 * (1 - ratio);
                            p.x -= attractStrength * dx;
                            p.y -= attractStrength * dy;
                        }

                        var radialV = (p.xa * dx + p.ya * dy) / dist;
                        if (radialV > 0) {
                            var damping = 0.2 + 0.8 * (1 - ratio);
                            var newRadialV = radialV * damping;
                            var deltaV = newRadialV - radialV;
                            p.xa += deltaV * dx / dist;
                            p.ya += deltaV * dy / dist;
                        }
                    }

                    // ---- 粒子间连线（使用 lineColor，参与渐变） ----
                    var r, g, b;
                    if (config.gradient) {
                        var offset = 50 * Math.sin(time * 0.8 + j * 0.2);
                        r = Math.min(255, Math.max(0, lineBaseColor[0] + offset * 0.3));
                        g = Math.min(255, Math.max(0, lineBaseColor[1] + offset * 0.5));
                        b = Math.min(255, Math.max(0, lineBaseColor[2] + offset * 0.7));
                    } else {
                        r = lineBaseColor[0];
                        g = lineBaseColor[1];
                        b = lineBaseColor[2];
                    }

                    ctx.beginPath();
                    ctx.lineWidth = Math.max(0.3, alpha * 0.8);
                    ctx.strokeStyle = 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + alpha + ')';
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }

            // ---- 速度恢复机制 ----
            var currentSpeed = Math.sqrt(p.xa * p.xa + p.ya * p.ya);
            var targetSpeed = p.initSpeed * 1.0;
            if (currentSpeed < targetSpeed && currentSpeed > 0) {
                var recoveryFactor = 0.02;
                var angle = Math.atan2(p.ya, p.xa) + (Math.random() - 0.5) * 0.5;
                p.xa += recoveryFactor * Math.cos(angle) * targetSpeed;
                p.ya += recoveryFactor * Math.sin(angle) * targetSpeed;
            } else if (currentSpeed > targetSpeed * 1.5) {
                p.xa *= 0.999;
                p.ya *= 0.999;
            }

            var idx = allNodes.indexOf(p);
            if (idx > -1) allNodes.splice(idx, 1);
        }

        animId = requestAnimationFrame(draw);
    }

    // ========== 启动动画 ==========
    function start() {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        updateSize();
        initParticles();
        setTimeout(function() {
            draw();
        }, 100);
    }

    // ========== 防抖resize（重新生成粒子适配新尺寸） ==========
    var debouncedResize = debounce(function() {
        updateSize();
        initParticles();   // 重新生成，适应新尺寸
    }, 200);

    window.addEventListener('resize', debouncedResize);

    // ========== 页面可见性暂停策略 ==========
    document.addEventListener('visibilitychange', function() {
        isPaused = document.hidden;
    });

    // ========== 鼠标事件 ==========
    window.addEventListener('mousemove', function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', function() {
        mouse.x = null;
        mouse.y = null;
    });

    // ========== 插入Canvas并启动 ==========
    var scriptCount = document.getElementsByTagName('script').length;
    canvas.id = 'c_n_' + scriptCount;
    canvas.style.cssText = 'position:fixed;top:0;left:0;z-index:' + config.zIndex + ';opacity:' + config.opacity + ';pointer-events:none;';
    document.body.appendChild(canvas);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
}();