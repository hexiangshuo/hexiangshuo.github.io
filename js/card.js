// source/js/fade-in-cards.js
// 功能：卡片进入视口淡入，离开视口淡出（可重复触发）

document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.index-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 进入视口 → 添加 visible 类（触发淡入动画）
                entry.target.classList.add('visible');
            } else {
                // 离开视口 → 移除 visible 类（触发淡出动画）
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.15 // 触发进入，低于此值视为离开
    });

    cards.forEach(card => observer.observe(card));
});