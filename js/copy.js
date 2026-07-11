// source/js/copy.js
(function() {
  'use strict';

  // ===== 配置 =====
  const CONFIG = {
    btnText: '📋 复制 Markdown 源码',
    btnSuccessText: '✅ 已复制！',
    btnErrorText: '❌ 获取失败',
    btnStyle: 'display: block; margin: 8px 0 12px 0; padding: 4px 0; cursor: pointer; background: transparent; color: #647587; font-size: 0.9rem; border: none; transition: color 0.2s, opacity 0.2s; text-align: left;',
    btnHoverStyle: 'color: #30a9de;'
  };

  // ===== 重置按钮状态 =====
  function resetButton(btn, originalText) {
    btn.textContent = originalText;
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.cursor = '';
    btn.style.color = '#647587'; // 恢复默认颜色
  }

  // ===== 获取当前文章的原始 Markdown =====
  function getCurrentPostRaw() {
    if (typeof postsData === 'undefined') {
      console.error('postsData 未定义');
      return null;
    }

    const currentPath = window.location.pathname;

    // 尝试直接匹配 path（已补前导斜杠）
    let post = postsData.find(p => p.path === currentPath);
    if (!post) {
      console.warn('未找到当前文章，路径:', currentPath);
      return null;
    }
    return post.raw;
  }

  // ===== 复制到剪贴板（带禁用状态） =====
  async function copyMarkdown(btn) {
    const originalText = btn.textContent;

    // 禁用按钮，防止重复点击
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';

    const markdown = getCurrentPostRaw();

    if (markdown === null) {
      btn.textContent = CONFIG.btnErrorText;
      setTimeout(() => {
        resetButton(btn, originalText);
      }, 2500);
      alert('无法获取文章源码，请检查数据。');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdown);
        btn.textContent = CONFIG.btnSuccessText;
        setTimeout(() => {
          resetButton(btn, originalText);
        }, 2000);
      } else {
        // 兼容旧浏览器
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        btn.textContent = CONFIG.btnSuccessText;
        setTimeout(() => {
          resetButton(btn, originalText);
        }, 2000);
      }
    } catch (error) {
      console.error('复制失败:', error);
      btn.textContent = CONFIG.btnErrorText;
      setTimeout(() => {
        resetButton(btn, originalText);
      }, 2500);
      alert('复制失败，请手动复制。');
    }
  }

  // ===== 注入按钮到侧边栏 =====
  function injectButton() {
    // 优先查找目录容器 #toc，如果不存在则查找 .sidebar
    let sidebar = document.querySelector('#toc');
    if (!sidebar) {
      sidebar = document.querySelector('.sidebar');
    }
    if (!sidebar) {
      console.warn('未找到侧边栏，按钮未添加');
      return;
    }
    if (document.getElementById('copy-md-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'copy-md-btn';
    btn.textContent = CONFIG.btnText;
    btn.style.cssText = CONFIG.btnStyle;

    // 悬停变色（仅在未禁用时）
    btn.addEventListener('mouseenter', function() {
      if (!this.disabled) {
        this.style.color = '#30a9de';
      }
    });
    btn.addEventListener('mouseleave', function() {
      if (!this.disabled) {
        this.style.color = '#647587';
      }
    });

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      copyMarkdown(this);
    });

    // 插入到侧边栏最顶部（目录上方）
    sidebar.insertBefore(btn, sidebar.firstChild);
  }

  // ===== 启动 =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();