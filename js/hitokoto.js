// source/js/hitokoto.js
document.addEventListener('DOMContentLoaded', function() {
    var container = document.createElement('p');
    container.id = 'hitokoto-container';
    container.style.cssText = 'font-size: 0.85rem; margin: 0; padding: 0; color: #888; text-align: right;';
    container.textContent = '✨ 加载一言中...';

    var footer = document.querySelector('footer');
    if (footer) {
        footer.appendChild(container);
    } else {
        document.body.appendChild(container);
    }

    // 修正：使用 & 连接参数
    fetch('https://v1.hitokoto.cn/?c=d&c=k')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            // 调试：查看返回的数据
            console.log('一言数据：', data);

            var text = data.hitokoto;
            if (data.from_who) text += ' —— ' + data.from_who;
            if (data.from) text += '《' + data.from + '》';
            // 如果既无作者也无作品，显示“未知出处”
            if (!data.from_who && !data.from) {
                text += ' —— 佚名';
            }
            container.textContent = text;
        })
        .catch(function(error) {
            console.error('一言加载失败：', error);
            container.textContent = '加载失败，请刷新';
        });
});