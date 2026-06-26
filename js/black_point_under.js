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
            opacity: parseFloat(getAttrOrDefault(lastScript, 'opacity', '0.5')),
            color: getAttrOrDefault(lastScript, 'color', '150,150,150'),
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
        for (var i = 0; i < config.count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                xa: 3 * Math.random() - 1,
                ya: 3 * Math.random() - 1,
                max: config.particleMax,
                // 保存初始速度大小，用于恢复
                initSpeed: Math.sqrt(Math.pow(3 * Math.random() - 1, 2) + Math.pow(3 * Math.random() - 1, 2))
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

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // 更新位置
            p.x += p.xa;
            p.y += p.ya;

            // 边界反弹
            if (p.x > width || p.x < 0) p.xa *= -1;
            if (p.y > height || p.y < 0) p.ya *= -1;

            // 绘制粒子点
            ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1);

            // 遍历其他节点（鼠标 + 其他粒子）
            for (var j = 0; j < allNodes.length; j++) {
                var other = allNodes[j];
                if (other === p) continue;
                if (other.x === null || other.y === null) continue;

                var dx = p.x - other.x;
                var dy = p.y - other.y;
                var distSq = dx * dx + dy * dy;
                var maxDistSq = other.max || config.particleMax;

                // 距离小于阈值才处理
                if (distSq < maxDistSq && distSq > 0.01) {
                    var dist = Math.sqrt(distSq);
                    var maxDist = Math.sqrt(maxDistSq);
                    var alpha = (maxDist - dist) / maxDist;
                    alpha = Math.min(1, Math.max(0, alpha));

                    // ====== 鼠标吸引（径向阻尼 + 速度恢复） ======
                    if (other === mouse && distSq > 0) {
                        // ---- 1. 位置吸引（柔和） ----
                        var ratio = dist / maxDist;
                        if (ratio < 1 && dist > 100) {
                            var attractStrength = 0.05 * (1 - ratio);
                            p.x -= attractStrength * dx;
                            p.y -= attractStrength * dy;
                        }

                        // ---- 2. 径向速度阻尼（仅在远离鼠标时） ----
                        var radialV = (p.xa * dx + p.ya * dy) / dist;
                        if (radialV > 0) {
                            // 平滑阻尼系数：距离越近阻尼越强
                            var damping = 0.1 + 0.9 * (1 - ratio);
                            var newRadialV = radialV * damping;
                            var deltaV = newRadialV - radialV;
                            p.xa += deltaV * dx / dist;
                            p.ya += deltaV * dy / dist;
                        }
                    }

                    // ---- 3. 粒子间连线 ----
                    var baseColor = config.color.split(',').map(Number);
                    var r, g, b;
                    if (config.gradient) {
                        var offset = 80 * Math.sin(time * 0.8 + j * 0.2);
                        r = Math.min(255, Math.max(0, baseColor[0] + offset));
                        g = Math.min(255, Math.max(0, baseColor[1] + offset * 0.7));
                        b = Math.min(255, Math.max(0, baseColor[2] + offset * 0.3));
                    } else {
                        r = baseColor[0];
                        g = baseColor[1];
                        b = baseColor[2];
                    }

                    ctx.beginPath();
                    ctx.lineWidth = Math.max(0.3, alpha * 1.2);
                    ctx.strokeStyle = 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + alpha + ')';
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }

            // ---- 4. 速度恢复机制（鼠标移开后恢复运动） ----
            var currentSpeed = Math.sqrt(p.xa * p.xa + p.ya * p.ya);
            var targetSpeed = p.initSpeed * 1.0; // 恢复到初始速度的80%
            if (currentSpeed < targetSpeed && currentSpeed > 0) {
                // 如果速度太小，向随机方向增加速度
                var recoveryFactor = 0.02; // 恢复速度
                var angle = Math.atan2(p.ya, p.xa) + (Math.random() - 0.5) * 0.5; // 加一点随机性
                p.xa += recoveryFactor * Math.cos(angle) * targetSpeed;
                p.ya += recoveryFactor * Math.sin(angle) * targetSpeed;
            } else if (currentSpeed > targetSpeed * 1.5) {
                // 如果速度过大，稍微减速（防止失控）
                p.xa *= 0.999;
                p.ya *= 0.999;
            }

            // 从候选列表中移除当前粒子，避免重复计算
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

    // ========== 防抖resize ==========
    var debouncedResize = debounce(function() {
        updateSize();
        for (var i = 0; i < particles.length; i++) {
            particles[i].x = (particles[i].x / width) * width;
            particles[i].y = (particles[i].y / height) * height;
        }
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