let currentPosts = [];
let filteredPosts = [];
let autoExtractSettings = {
  enabled: false,
  extractOnLoad: true,
  detectOnScroll: true,
  detectInterval: 2,
  maxPosts: 100,
  showNotification: true
};

document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  const downloadCoversBtn = document.getElementById('downloadCoversBtn');
  const downloadAvatarsBtn = document.getElementById('downloadAvatarsBtn');
  const copyLinksBtn = document.getElementById('copyLinksBtn');
  const filterBtn = document.getElementById('filterBtn');
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const minLikesInput = document.getElementById('minLikes');
  
  const contentDiv = document.getElementById('content');
  const postCountSpan = document.getElementById('postCount');
  const totalLikesSpan = document.getElementById('totalLikes');
  const uniqueAuthorsSpan = document.getElementById('uniqueAuthors');
  const downloadProgress = document.getElementById('downloadProgress');
  const progressLabel = document.getElementById('progressLabel');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  
  const autoExtractToggle = document.getElementById('autoExtractToggle');
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const autoExtractSettingsBtn = document.getElementById('autoExtractSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const notification = document.getElementById('notification');
  const notificationText = document.getElementById('notificationText');

  extractBtn.addEventListener('click', extractPosts);
  refreshBtn.addEventListener('click', () => {
    location.reload();
  });
  exportJsonBtn.addEventListener('click', exportJson);
  exportCsvBtn.addEventListener('click', exportCsv);
  exportExcelBtn.addEventListener('click', exportExcel);
  downloadCoversBtn.addEventListener('click', () => downloadImages('cover'));
  downloadAvatarsBtn.addEventListener('click', () => downloadImages('avatar'));
  copyLinksBtn.addEventListener('click', copyAllLinks);
  filterBtn.addEventListener('click', applyFilters);
  resetFilterBtn.addEventListener('click', resetFilters);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') applyFilters();
  });
  sortSelect.addEventListener('change', applyFilters);

  autoExtractToggle.addEventListener('click', (e) => {
    console.log('[XHS Popup] 自动提取开关被点击');
    e.preventDefault();
    e.stopPropagation();
    toggleAutoExtract();
  });
  autoExtractSettingsBtn.addEventListener('click', (e) => {
    console.log('[XHS Popup] 设置按钮被点击');
    e.preventDefault();
    e.stopPropagation();
    openSettings();
  });
  closeSettingsBtn.addEventListener('click', (e) => {
    console.log('[XHS Popup] 关闭设置按钮被点击');
    e.preventDefault();
    e.stopPropagation();
    closeSettings();
  });
  cancelSettingsBtn.addEventListener('click', (e) => {
    console.log('[XHS Popup] 取消设置按钮被点击');
    e.preventDefault();
    e.stopPropagation();
    closeSettings();
  });
  saveSettingsBtn.addEventListener('click', (e) => {
    console.log('[XHS Popup] 保存设置按钮被点击');
    e.preventDefault();
    e.stopPropagation();
    saveSettings();
  });

  loadSettings();
  updateAutoExtractUI();
  checkAutoExtractStatus();

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
        filteredPosts = [...currentPosts];
        updateStats();
        renderPosts(filteredPosts);
      } else {
        showError('提取失败，请确保页面已完全加载');
      }
    } catch (error) {
      console.error('[XHS Popup] 提取帖子时出错:', error);
      showError('提取失败: ' + error.message);
    }
  }

  function updateStats() {
    postCountSpan.textContent = filteredPosts.length;
    
    const totalLikes = filteredPosts.reduce((sum, post) => {
      const likes = parseInt(post.likeCount.replace(/,/g, '')) || 0;
      return sum + likes;
    }, 0);
    totalLikesSpan.textContent = totalLikes.toLocaleString();
    
    const uniqueAuthors = new Set(filteredPosts.map(post => post.author)).size;
    uniqueAuthorsSpan.textContent = uniqueAuthors;
  }

  function applyFilters() {
    let posts = [...currentPosts];
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    const minLikes = parseInt(minLikesInput.value) || 0;
    const sortBy = sortSelect.value;

    if (searchTerm) {
      posts = posts.filter(post => 
        (post.title && post.title.toLowerCase().includes(searchTerm)) ||
        (post.author && post.author.toLowerCase().includes(searchTerm))
      );
    }

    if (minLikes > 0) {
      posts = posts.filter(post => {
        const likes = parseInt(post.likeCount.replace(/,/g, '')) || 0;
        return likes >= minLikes;
      });
    }

    switch (sortBy) {
      case 'likes-desc':
        posts.sort((a, b) => {
          const likesA = parseInt(a.likeCount.replace(/,/g, '')) || 0;
          const likesB = parseInt(b.likeCount.replace(/,/g, '')) || 0;
          return likesB - likesA;
        });
        break;
      case 'likes-asc':
        posts.sort((a, b) => {
          const likesA = parseInt(a.likeCount.replace(/,/g, '')) || 0;
          const likesB = parseInt(b.likeCount.replace(/,/g, '')) || 0;
          return likesA - likesB;
        });
        break;
      case 'title-asc':
        posts.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'zh-CN'));
        break;
      case 'title-desc':
        posts.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'zh-CN'));
        break;
    }

    filteredPosts = posts;
    updateStats();
    renderPosts(filteredPosts);
  }

  function resetFilters() {
    searchInput.value = '';
    minLikesInput.value = '';
    sortSelect.value = 'default';
    filteredPosts = [...currentPosts];
    updateStats();
    renderPosts(filteredPosts);
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
      <div class="post-card" onclick="window.open('${escapeHtml(post.postLink)}', '_blank')">
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

  function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    contentDiv.insertBefore(successDiv, contentDiv.firstChild);
    
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function exportJson() {
    if (!filteredPosts || filteredPosts.length === 0) {
      alert('请先提取帖子数据');
      return;
    }

    const dataStr = JSON.stringify(filteredPosts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `xiaohongshu_posts_${timestamp}.json`;
    
    downloadFile(url, filename);
  }

  function exportCsv() {
    if (!filteredPosts || filteredPosts.length === 0) {
      alert('请先提取帖子数据');
      return;
    }

    const headers = ['序号', '帖子ID', '标题', '发布者', '发布者头像', '点赞数', '发布时间', '封面图', '帖子链接'];
    const csvRows = [headers.join(',')];

    filteredPosts.forEach(post => {
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

  function exportExcel() {
    if (!filteredPosts || filteredPosts.length === 0) {
      alert('请先提取帖子数据');
      return;
    }

    const headers = ['序号', '帖子ID', '标题', '发布者', '发布者头像', '点赞数', '发布时间', '封面图', '帖子链接'];
    const rows = filteredPosts.map(post => [
      post.index,
      post.postId,
      post.title || '',
      post.author || '',
      post.authorAvatar,
      post.likeCount,
      post.publishTime,
      post.coverImage,
      post.postLink
    ]);

    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><meta charset="UTF-8"><style>';
    excelContent += 'table { border-collapse: collapse; }';
    excelContent += 'td { border: 1px solid #ccc; padding: 5px; mso-number-format:"\@"; }';
    excelContent += 'th { background-color: #ff2442; color: white; border: 1px solid #ccc; padding: 5px; }';
    excelContent += '</style></head><body>';
    excelContent += '<table>';
    
    excelContent += '<tr>';
    headers.forEach(header => {
      excelContent += `<th>${header}</th>`;
    });
    excelContent += '</tr>';

    rows.forEach(row => {
      excelContent += '<tr>';
      row.forEach(cell => {
        excelContent += `<td>${cell}</td>`;
      });
      excelContent += '</tr>';
    });

    excelContent += '</table></body></html>';

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `xiaohongshu_posts_${timestamp}.xls`;
    
    downloadFile(url, filename);
  }

  async function downloadImages(type) {
    if (!filteredPosts || filteredPosts.length === 0) {
      alert('请先提取帖子数据');
      return;
    }

    const images = filteredPosts.map(post => ({
      url: type === 'cover' ? post.coverImage : post.authorAvatar,
      filename: type === 'cover' 
        ? `${post.index}_${post.postId}_cover.jpg`
        : `${post.index}_${post.author}_avatar.jpg`
    })).filter(img => img.url);

    if (images.length === 0) {
      alert('没有可下载的图片');
      return;
    }

    downloadProgress.style.display = 'block';
    let downloaded = 0;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      try {
        await downloadImage(img.url, img.filename);
        downloaded++;
        const progress = Math.round((downloaded / images.length) * 100);
        progressLabel.textContent = `正在下载: ${downloaded}/${images.length}`;
        progressPercent.textContent = `${progress}%`;
        progressBarFill.style.width = `${progress}%`;
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`下载图片失败: ${img.filename}`, error);
      }
    }

    progressLabel.textContent = `下载完成: ${downloaded}/${images.length}`;
    showSuccess(`成功下载 ${downloaded} 张${type === 'cover' ? '封面' : '头像'}图片`);
    
    setTimeout(() => {
      downloadProgress.style.display = 'none';
      progressBarFill.style.width = '0%';
    }, 3000);
  }

  function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: url,
        filename: `xiaohongshu/${filename}`,
        conflictAction: 'uniquify',
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(downloadId);
        }
      });
    });
  }

  function copyAllLinks() {
    if (!filteredPosts || filteredPosts.length === 0) {
      alert('请先提取帖子数据');
      return;
    }

    const links = filteredPosts.map(post => post.postLink).filter(link => link).join('\n');
    
    navigator.clipboard.writeText(links).then(() => {
      showSuccess(`已复制 ${filteredPosts.length} 个帖子链接`);
    }).catch(err => {
      alert('复制失败: ' + err.message);
    });
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

  function loadSettings() {
    console.log('[XHS Popup] 加载设置...');
    chrome.storage.local.get(['autoExtractSettings'], (result) => {
      console.log('[XHS Popup] 从存储加载的设置:', result);
      if (result.autoExtractSettings) {
        autoExtractSettings = { ...autoExtractSettings, ...result.autoExtractSettings };
        console.log('[XHS Popup] 合并后的设置:', autoExtractSettings);
      }
    });
  }

  function saveSettings() {
    console.log('[XHS Popup] 保存设置...');
    const extractOnLoad = document.getElementById('extractOnLoad').checked;
    const detectOnScroll = document.getElementById('detectOnScroll').checked;
    const detectInterval = parseInt(document.getElementById('detectInterval').value);
    const maxPosts = parseInt(document.getElementById('maxPosts').value);
    const showNotification = document.getElementById('showNotification').checked;

    console.log('[XHS Popup] 新设置值:', { extractOnLoad, detectOnScroll, detectInterval, maxPosts, showNotification });

    autoExtractSettings = {
      ...autoExtractSettings,
      extractOnLoad,
      detectOnScroll,
      detectInterval,
      maxPosts,
      showNotification
    };

    console.log('[XHS Popup] 保存到存储:', autoExtractSettings);
    chrome.storage.local.set({ autoExtractSettings }, () => {
      console.log('[XHS Popup] 设置已保存到存储');
      closeSettings();
      showNotificationMessage('设置已保存', 'success');
      
      if (autoExtractSettings.enabled) {
        updateAutoExtractUI();
        checkAutoExtractStatus();
      }
    });
  }

  function toggleAutoExtract() {
    console.log('[XHS Popup] 切换自动提取状态，当前状态:', autoExtractSettings.enabled);
    autoExtractSettings.enabled = !autoExtractSettings.enabled;
    console.log('[XHS Popup] 新状态:', autoExtractSettings.enabled);
    
    chrome.storage.local.set({ autoExtractSettings }, () => {
      console.log('[XHS Popup] 状态已保存到存储');
      updateAutoExtractUI();
      
      if (autoExtractSettings.enabled) {
        showNotificationMessage('自动提取已启用', 'success');
        checkAutoExtractStatus();
      } else {
        showNotificationMessage('自动提取已禁用', 'info');
        disableAutoExtract();
      }
    });
  }

  function updateAutoExtractUI() {
    if (autoExtractSettings.enabled) {
      toggleSwitch.classList.add('active');
      statusDot.classList.add('active');
      statusText.textContent = '运行中';
    } else {
      toggleSwitch.classList.remove('active');
      statusDot.classList.remove('active');
      statusText.textContent = '未启用';
    }
  }

  async function checkAutoExtractStatus() {
    if (!autoExtractSettings.enabled) {
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('xiaohongshu.com/explore')) {
        statusDot.classList.remove('active');
        statusDot.classList.add('paused');
        statusText.textContent = '等待页面';
        return;
      }

      statusDot.classList.add('active');
      statusDot.classList.remove('paused');
      statusText.textContent = '运行中';

      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'GET_AUTO_EXTRACT_STATUS' 
      });

      if (response && response.isRunning) {
        if (response.newPostsCount > 0) {
          showNotificationMessage(`已提取 ${response.newPostsCount} 个新帖子`, 'success');
          await extractPosts();
        }
      } else {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'START_AUTO_EXTRACT',
          settings: autoExtractSettings
        });
      }
    } catch (error) {
      console.error('[XHS Popup] 检查自动提取状态时出错:', error);
    }
  }

  async function disableAutoExtract() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url.includes('xiaohongshu.com/explore')) {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'STOP_AUTO_EXTRACT' 
        });
      }
    } catch (error) {
      console.error('[XHS Popup] 禁用自动提取时出错:', error);
    }
  }

  function openSettings() {
    document.getElementById('extractOnLoad').checked = autoExtractSettings.extractOnLoad;
    document.getElementById('detectOnScroll').checked = autoExtractSettings.detectOnScroll;
    document.getElementById('detectInterval').value = autoExtractSettings.detectInterval;
    document.getElementById('maxPosts').value = autoExtractSettings.maxPosts;
    document.getElementById('showNotification').checked = autoExtractSettings.showNotification;
    
    settingsModal.classList.add('show');
  }

  function closeSettings() {
    settingsModal.classList.remove('show');
  }

  function showNotificationMessage(message, type = 'info') {
    if (!autoExtractSettings.showNotification) {
      return;
    }

    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'AUTO_EXTRACT_NEW_POSTS') {
      if (autoExtractSettings.enabled) {
        showNotificationMessage(`已提取 ${request.count} 个新帖子`, 'success');
        extractPosts();
      }
    }
  });
});
