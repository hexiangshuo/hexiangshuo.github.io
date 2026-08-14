// source/js/ripple-effect.js
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        const colors = ['#30a9de', '#f39c12', '#e74c6f', '#2ecc71', '#9b59b6'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: fixed;
            left: ${e.clientX - 20}px;
            top: ${e.clientY - 20}px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid ${color};
            pointer-events: none;
            z-index: 99999;
            transition: all 0.3s ease-out;
            transform: scale(0.4);
            opacity: 0.8;
        `;
        document.body.appendChild(ripple);

        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(4)';
            ripple.style.opacity = '0';
        });

        setTimeout(() => ripple.remove(), 900);
    });
});