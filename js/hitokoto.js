// source/js/hitokoto.js
document.addEventListener('DOMContentLoaded', function() {
    // 1. 创建 <a> 作为容器
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
        float: right;
        transition: color 0.3s ease;
    `;
    container.textContent = '✨ 加载一言中...';

    // 2. 插入到页脚
    var footer = document.querySelector('footer');
    if (footer) {
        footer.appendChild(container);
    } else {
        document.body.appendChild(container);
    }

    // 3. 鼠标悬停变色
    container.addEventListener('mouseenter', function() {
        this.style.color = '#30A9DE';
    });
    container.addEventListener('mouseleave', function() {
        this.style.color = '#888';
    });

    // 4. 请求一言数据
    fetch('https://v1.hitokoto.cn/?c=d&c=k')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            console.log('一言数据：', data);

            // ----- 修复：去空格处理 -----
            var fromWho = (data.from_who || '').trim();
            var from = (data.from || '').trim();

            var text = data.hitokoto;
            text += ' —— ';

            if (fromWho) text += fromWho;
            if (from) text += '《' + from + '》';

            if (!fromWho && !from) {
                text += '佚名';
            }

            container.textContent = text;

            if (data.uuid) {
                container.href = 'https://hitokoto.cn?uuid=' + data.uuid;
            } else {
                container.href = '#';
                container.style.cursor = 'default';
                container.style.textDecoration = 'none';
            }
        })
        .catch(function(error) {
            console.error('一言加载失败：', error);
            container.textContent = '加载失败，请刷新';
            container.href = '#';
            container.style.cursor = 'default';
        });
});