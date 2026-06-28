// source/js/hitokoto.js
document.addEventListener('DOMContentLoaded', function() {
    // 1. 创建 <a> 作为容器（初始 href 为 #）
    var container = document.createElement('a');
    container.id = 'hitokoto-container';
    container.href = '#';
    container.target = '_blank';  // 新标签页打开
    container.style.cssText = `
        font-size: 0.85rem;
        margin: 0;
        padding: 0;
        color: #888;
        text-align: right;
        text-decoration: none;
        cursor: pointer;
        display: block;
        transition: color 0.3s ease;   /* 平滑变色过渡 */
    `;
    container.textContent = '✨ 加载一言中...';

    // 2. 插入到页脚
    var footer = document.querySelector('footer');
    if (footer) {
        footer.appendChild(container);
    } else {
        document.body.appendChild(container);
    }

    // 3. 鼠标悬停变色（进入和离开）
    container.addEventListener('mouseenter', function() {
        this.style.color = '#30A9DE';   // 蓝色，可自行修改
    });
    container.addEventListener('mouseleave', function() {
        this.style.color = '#888';      // 恢复原色
    });

    // 4. 请求一言数据
    fetch('https://v1.hitokoto.cn/?c=d&c=k')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            console.log('一言数据：', data);

            var text = data.hitokoto;
            if (data.from_who) text += ' —— ' + data.from_who;
            if (data.from) text += '《' + data.from + '》';
            if (!data.from_who && !data.from) {
                text += ' —— 佚名';
            }
            container.textContent = text;

            // 5. 设置跳转链接（如果存在 uuid）
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