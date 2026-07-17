// source/js/mac-dots.js
document.addEventListener('DOMContentLoaded', function() {
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(function(hl) {
        if (hl.querySelector('.mac-dot')) return;

        const dots = [
            { color: '#fc625d', left: 12, icon: '×' },
            { color: '#fdbc40', left: 32, icon: '−' },
            { color: '#35cd4b', left: 52, icon: '+' }
        ];

        dots.forEach(function(d) {
            const dot = document.createElement('span');
            dot.className = 'mac-dot';
            dot.style.cssText = `
                position: absolute;
                top: 10px;
                left: ${d.left}px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background-color: ${d.color};
                cursor: default;
                text-align: center;
                line-height: 10px;
                font-size: 14px;          /* 从 10px 增大到 12px */
                color: rgba(0, 0, 0, 0.75);
                font-weight: bold;
                z-index: 5;
                transition: filter 0.15s ease, box-shadow 0.15s ease;
                user-select: none;
                box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            `;
            dot.dataset.icon = d.icon;

            dot.addEventListener('mouseenter', function() {
                this.textContent = d.icon;
                this.style.filter = 'brightness(1.15)';
                this.style.boxShadow = '0 0 6px rgba(0,0,0,0.12)';
            });
            dot.addEventListener('mouseleave', function() {
                this.textContent = '';
                this.style.filter = 'brightness(1)';
                this.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.05)';
            });

            hl.appendChild(dot);
        });
    });
});