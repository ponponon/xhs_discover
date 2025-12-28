let currentPosts = [];

document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const contentDiv = document.getElementById('content');
  const postCountSpan = document.getElementById('postCount');

  extractBtn.addEventListener('click', extractPosts);
  refreshBtn.addEventListener('click', () => {
    location.reload();
  });
  exportJsonBtn.addEventListener('click', exportJson);
  exportCsvBtn.addEventListener('click', exportCsv);

  async function extractPosts() {
    showLoading();
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('xiaohongshu.com/explore')) {
        showError('请先访问小红书探索页面: https://www.xiaohongshu.com/explore');
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_POSTS' });
      
      if (response && response.success) {
        currentPosts = response.posts;
        postCountSpan.textContent = currentPosts.length;
        renderPosts(currentPosts);
      } else {
        showError('提取失败，请确保页面已完全加载');
      }
    } catch (error) {
      console.error('提取帖子时出错:', error);
      showError('提取失败: ' + error.message);
    }
  }

  function renderPosts(posts) {
    if (!posts || posts.length === 0) {
      contentDiv.innerHTML = `
        <div class="empty">
          <div class="empty-icon">📭</div>
          <p>未找到帖子，请确保页面已完全加载</p>
        </div>
      `;
      return;
    }

    const gridHtml = `
      <div class="post-grid">
        ${posts.map(post => createPostCard(post)).join('')}
      </div>
    `;
    
    contentDiv.innerHTML = gridHtml;
  }

  function createPostCard(post) {
    return `
      <div class="post-card">
        <img class="post-cover" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22240%22 height=%22160%22><rect fill=%22%23f0f0f0%22 width=%22240%22 height=%22160%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22>无封面</text></svg>'">
        <div class="post-info">
          <div class="post-title" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</div>
          <div class="post-author">
            <img class="author-avatar" src="${escapeHtml(post.authorAvatar)}" alt="${escapeHtml(post.author)}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22><circle fill=%22%23ddd%22 cx=%2212%22 cy=%2212%22 r=%2212%22/></svg>'">
            <span class="author-name" title="${escapeHtml(post.author)}">${escapeHtml(post.author)}</span>
          </div>
          <div class="post-meta">
            <span class="like-count">${escapeHtml(post.likeCount)}</span>
            <span class="publish-time">${escapeHtml(post.publishTime)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function showLoading() {
    contentDiv.innerHTML = `
      <div class="loading">
        <p>正在提取帖子...</p>
      </div>
    `;
  }

  function showError(message) {
    contentDiv.innerHTML = `
      <div class="error">
        ${escapeHtml(message)}
      </div>
    `;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function exportJson() {
    if (!currentPosts || currentPosts.length === 0) {
      alert('请先提取帖子数据');
      return;
    }

    const dataStr = JSON.stringify(currentPosts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `xiaohongshu_posts_${timestamp}.json`;
    
    downloadFile(url, filename);
  }

  function exportCsv() {
    if (!currentPosts || currentPosts.length === 0) {
      alert('请先提取帖子数据');
      return;
    }

    const headers = ['序号', '帖子ID', '标题', '发布者', '发布者头像', '点赞数', '发布时间', '封面图', '帖子链接'];
    const csvRows = [headers.join(',')];

    currentPosts.forEach(post => {
      const row = [
        post.index,
        post.postId,
        `"${(post.title || '').replace(/"/g, '""')}"`,
        `"${(post.author || '').replace(/"/g, '""')}"`,
        post.authorAvatar,
        post.likeCount,
        post.publishTime,
        post.coverImage,
        post.postLink
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `xiaohongshu_posts_${timestamp}.csv`;
    
    downloadFile(url, filename);
  }

  function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});
