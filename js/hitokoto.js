// source/js/hitokoto.js
document.addEventListener('DOMContentLoaded', function() {
    // ===== 配置 =====
    var API_URL = 'https://v1.hitokoto.cn/?c=d&c=k';

    // ===== 创建一言容器 =====
    var container = document.createElement('a');
    container.id = 'hitokoto-container';
    container.href = '#';
    container.target = '_blank';
    container.style.cssText = `
        font-size: 0.85rem;
        margin: 0;
        padding: 0;
        color: #888;
        text-decoration: none;
        cursor: pointer;
        display: inline-block;
        transition: color 0.3s ease;
    `;
    container.textContent = '✨ 加载一言中...';

    // ===== 创建刷新按钮 =====
    var refreshBtn = document.createElement('button');
    refreshBtn.id = 'hitokoto-refresh';
    refreshBtn.textContent = '↻';
    refreshBtn.style.cssText = `
        font-size: 0.85rem;
        margin: 0 6px 0 6px;
        padding: 0;
        border: none;
        background: transparent;
        color: #888;
        cursor: pointer;
        transition: color 0.3s ease, transform 0.3s ease;
        display: inline-block;
        line-height: 1;
        opacity: 0.5;
    `;
    refreshBtn.title = '换一句';

    refreshBtn.addEventListener('mouseenter', function() {
        this.style.color = '#30A9DE';
        this.style.opacity = '1';
    });
    refreshBtn.addEventListener('mouseleave', function() {
        if (!this.disabled) {
            this.style.color = '#888';
            this.style.opacity = '0.5';
        }
    });

    // ===== 插入到页脚 =====
    var footer = document.querySelector('footer');
    if (footer) {
        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: inline-flex; align-items: center; float: right;';
        wrapper.appendChild(container);
        wrapper.appendChild(refreshBtn);
        footer.appendChild(wrapper);
    } else {
        document.body.appendChild(container);
        document.body.appendChild(refreshBtn);
    }

    container.addEventListener('mouseenter', function() {
        this.style.color = '#30A9DE';
    });
    container.addEventListener('mouseleave', function() {
        this.style.color = '#888';
    });

    // ===== 加载一言数据 =====
    function loadHitokoto() {
        refreshBtn.disabled = true;
        refreshBtn.style.opacity = '0.3';
        refreshBtn.style.cursor = 'not-allowed';
        container.textContent = '✨ 加载一言中...';

        fetch(API_URL)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                console.log('一言数据：', data);
                var fromWho = (data.from_who || '').trim();
                var from = (data.from || '').trim();
                var text = data.hitokoto;
                text += ' —— ';
                if (fromWho) text += fromWho;
                if (from) text += '《' + from + '》';
                if (!fromWho && !from) text += '佚名';
                container.textContent = text;
                if (data.uuid) {
                    container.href = 'https://hitokoto.cn?uuid=' + data.uuid;
                } else {
                    container.href = '#';
                    container.style.cursor = 'default';
                    container.style.textDecoration = 'none';
                }
                // ===== 归位：重置颜色和状态 =====
                refreshBtn.disabled = false;
                refreshBtn.style.color = '#888';      // ← 颜色归位
                refreshBtn.style.opacity = '0.5';
                refreshBtn.style.cursor = 'pointer';
            })
            .catch(function(error) {
                console.error('一言加载失败：', error);
                container.textContent = '加载失败，请刷新';
                container.href = '#';
                container.style.cursor = 'default';
                // ===== 归位：重置颜色和状态 =====
                refreshBtn.disabled = false;
                refreshBtn.style.color = '#888';      // ← 颜色归位
                refreshBtn.style.opacity = '0.5';
                refreshBtn.style.cursor = 'pointer';
            });
    }

    refreshBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!this.disabled) loadHitokoto();
    });

    loadHitokoto();
});