// source/js/random.js
(function() {
    var randomLink = null;

    // ===== 重置导航栏状态 =====
    function resetRandomLink() {
        if (!randomLink) return;
        var original = randomLink.getAttribute('data-original');
        if (original) {
            randomLink.innerHTML = original;
        }
        // 恢复样式
        randomLink.style.pointerEvents = '';
        randomLink.style.opacity = '';
        randomLink.style.cursor = '';
    }

    function getRandomPost() {
        if (typeof postsList === 'undefined' || postsList.length === 0) {
            console.warn('没有文章数据');
            return;
        }

        if (!randomLink) {
            var index = Math.floor(Math.random() * postsList.length);
            window.location.href = postsList[index];
            return;
        }

        // 保存原始内容（仅第一次）
        if (!randomLink.getAttribute('data-original')) {
            randomLink.setAttribute('data-original', randomLink.innerHTML);
        }

        // 修改导航栏文字和样式
        randomLink.innerHTML = '⏳ 跳转中…';
        randomLink.style.pointerEvents = 'none';
        randomLink.style.opacity = '0.7';
        randomLink.style.cursor = 'default';

        var index = Math.floor(Math.random() * postsList.length);
        var url = postsList[index];

        setTimeout(function() {
            window.location.href = url;
        }, 300);
    }

    // ===== 初始化 =====
    function init() {
        randomLink = document.querySelector('a[href="#random"]');
        if (randomLink) {
            // 保存原始内容（关键：不执行重置，仅保存）
            if (!randomLink.getAttribute('data-original')) {
                randomLink.setAttribute('data-original', randomLink.innerHTML);
            }
            // 绑定点击事件
            randomLink.addEventListener('click', function(e) {
                e.preventDefault();
                getRandomPost();
            });
        }
    }

    // 正常页面加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ===== 监听 bfcache 恢复 =====
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // 从 bfcache 恢复，重置状态（此时 data-original 已存在）
            resetRandomLink();
            // 重新绑定事件（如果丢失）
            if (randomLink) {
                randomLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    getRandomPost();
                });
            }
        }
    });
})();