class XiaohongshuScraper {
  constructor() {
    this.posts = [];
    this.autoExtractManager = null;
  }

  extractPosts() {
    const noteItems = document.querySelectorAll('.note-item');
    
    noteItems.forEach((item, index) => {
      try {
        const post = this.extractPostData(item, index);
        if (post) {
          this.posts.push(post);
        }
      } catch (error) {
        console.error(`[XHS Scraper] 提取帖子 ${index} 时出错:`, error);
      }
    });

    return this.posts;
  }

  extractPostData(item, index) {
    const coverImg = item.querySelector('.cover img');
    const titleElement = item.querySelector('.footer .title span');
    const authorElement = item.querySelector('.author-wrapper .author .name');
    const likeCountElement = item.querySelector('.author-wrapper .like-wrapper .count');
    const linkElement = item.querySelector('.cover');

    let authorAvatar = '';
    
    // 直接查找带有author-avatar类的img标签（小红书当前结构）
    const authorAvatarImg = item.querySelector('.author-wrapper .author img.author-avatar');
    if (authorAvatarImg) {
      authorAvatar = authorAvatarImg.src;
    } else {
      // 兼容旧结构：查找author-avatar容器内的img
      const nestedAvatarImg = item.querySelector('.author-wrapper .author .author-avatar img');
      if (nestedAvatarImg) {
        authorAvatar = nestedAvatarImg.src;
      } else {
        // 兼容无img标签的情况，从背景图获取
        const authorAvatarDiv = item.querySelector('.author-wrapper .author .author-avatar');
        if (authorAvatarDiv) {
          const bgImage = window.getComputedStyle(authorAvatarDiv).backgroundImage;
          if (bgImage && bgImage !== 'none') {
            authorAvatar = bgImage.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
          }
        }
      }
    }

    const coverImage = coverImg ? coverImg.src : '';
    const title = titleElement ? titleElement.textContent.trim() : '';
    const author = authorElement ? authorElement.textContent.trim() : '';
    const likeCount = likeCountElement ? likeCountElement.textContent.trim() : '0';
    const postLink = linkElement ? linkElement.href : '';
    const postId = postLink.match(/\/explore\/([a-f0-9]+)/)?.[1] || '';

    if (!coverImage && !title) {
      return null;
    }

    return {
      index: index + 1,
      postId: postId,
      coverImage: coverImage,
      title: title,
      author: author,
      authorAvatar: authorAvatar,
      likeCount: likeCount,
      postLink: postLink,
      publishTime: this.extractPublishTime(item)
    };
  }

  extractPublishTime(item) {
    const timeElement = item.querySelector('.time, .publish-time, [class*="time"]');
    if (timeElement) {
      return timeElement.textContent.trim();
    }
    
    const footerText = item.querySelector('.footer')?.textContent || '';
    const timeMatch = footerText.match(/(\d+分钟前|\d+小时前|\d+天前|\d{4}-\d{2}-\d{2})/);
    if (timeMatch) {
      return timeMatch[1];
    }

    return '未知';
  }

  startAutoExtract(settings) {
    if (this.autoExtractManager) {
      this.autoExtractManager.stop();
    }

    this.autoExtractManager = new AutoExtractManager(settings, this);
    this.autoExtractManager.start();
  }

  stopAutoExtract() {
    if (this.autoExtractManager) {
      this.autoExtractManager.stop();
      this.autoExtractManager = null;
    }
  }

  getAutoExtractStatus() {
    if (!this.autoExtractManager) {
      return { isRunning: false, newPostsCount: 0 };
    }

    return {
      isRunning: this.autoExtractManager.isRunning,
      newPostsCount: this.autoExtractManager.newPostsCount
    };
  }
}

class AutoExtractManager {
  constructor(settings, scraper) {
    this.settings = settings;
    this.scraper = scraper;
    this.isRunning = false;
    this.observer = null;
    this.timer = null;
    this.lastPostCount = 0;
    this.newPostsCount = 0;
    this.scrollHandler = null;
    this.throttleTimer = null;
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastPostCount = document.querySelectorAll('.note-item').length;
    this.newPostsCount = 0;

    this.extractAndNotify();
    this.setupScrollListener();
    this.setupDOMObserver();
    this.setupPeriodicCheck();

    console.log('[XHS AutoExtract] 自动提取已启动');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }

    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }

    console.log('[XHS AutoExtract] 自动提取已停止');
  }

  setupScrollListener() {
    this.scrollHandler = () => {
      if (this.throttleTimer) {
        return;
      }

      this.throttleTimer = setTimeout(() => {
        this.checkForNewPosts();
        this.throttleTimer = null;
      }, 500);
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  setupDOMObserver() {
    const feedsContainer = document.querySelector('.feeds-page') || document.body;
    
    this.observer = new MutationObserver((mutations) => {
      if (!this.isRunning) {
        return;
      }

      let hasNewPosts = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.classList?.contains('note-item')) {
                hasNewPosts = true;
              } else if (node.querySelector?.('.note-item')) {
                hasNewPosts = true;
              }
            }
          });
        }
      });

      if (hasNewPosts) {
        this.checkForNewPosts();
      }
    });

    this.observer.observe(feedsContainer, {
      childList: true,
      subtree: true
    });
  }

  setupPeriodicCheck() {
    const interval = this.settings.detectInterval * 1000;
    this.timer = setInterval(() => {
      this.checkForNewPosts();
    }, interval);
  }

  checkForNewPosts() {
    if (!this.isRunning) {
      return;
    }

    const currentPostCount = document.querySelectorAll('.note-item').length;
    
    if (currentPostCount > this.lastPostCount) {
      const newCount = currentPostCount - this.lastPostCount;
      this.newPostsCount += newCount;
      this.lastPostCount = currentPostCount;

      console.log(`[XHS AutoExtract] 检测到 ${newCount} 个新帖子，总新帖子数: ${this.newPostsCount}`);

      // 立即提取新帖子
      this.extractAndNotify();

      if (this.settings.maxPosts > 0 && currentPostCount >= this.settings.maxPosts) {
        console.log(`[XHS AutoExtract] 已达到最大提取数量 ${this.settings.maxPosts}`);
        this.stop();
      }
    }
  }

  extractAndNotify() {
    const posts = this.scraper.extractPosts();
    
    if (posts.length > 0) {
      chrome.runtime.sendMessage({
        type: 'AUTO_EXTRACT_NEW_POSTS',
        count: posts.length
      });
    }
  }
}

const scraper = new XiaohongshuScraper();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_POSTS') {
    const posts = scraper.extractPosts();
    sendResponse({ success: true, posts: posts });
  } else if (request.action === 'START_AUTO_EXTRACT') {
    scraper.startAutoExtract(request.settings);
    sendResponse({ success: true });
  } else if (request.action === 'STOP_AUTO_EXTRACT') {
    scraper.stopAutoExtract();
    sendResponse({ success: true });
  } else if (request.action === 'GET_AUTO_EXTRACT_STATUS') {
    const status = scraper.getAutoExtractStatus();
    sendResponse(status);
  }
  return true;
});

// 重构自动提取启动逻辑
function initializeAutoExtract() {
  // 等待DOM完全准备好
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[XHS AutoExtract] DOM完全加载，开始初始化自动提取');
      startAutoExtractIfEnabled();
    });
  } else {
    console.log('[XHS AutoExtract] DOM已准备好，开始初始化自动提取');
    startAutoExtractIfEnabled();
  }
}

function startAutoExtractIfEnabled() {
  chrome.storage.local.get(['autoExtractSettings'], (result) => {
    const settings = result.autoExtractSettings;
    console.log('[XHS AutoExtract] 从存储获取自动提取设置:', settings);
    
    if (settings && settings.enabled) {
      console.log('[XHS AutoExtract] 自动提取已启用，开始启动');
      scraper.startAutoExtract(settings);
    } else {
      console.log('[XHS AutoExtract] 自动提取未启用');
    }
  });
}

// 监听存储变化，确保设置更新时立即生效
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.autoExtractSettings) {
    const newSettings = changes.autoExtractSettings.newValue;
    console.log('[XHS AutoExtract] 检测到设置变化:', newSettings);
    
    if (newSettings.enabled) {
      console.log('[XHS AutoExtract] 自动提取已启用，启动服务');
      scraper.startAutoExtract(newSettings);
    } else {
      console.log('[XHS AutoExtract] 自动提取已禁用，停止服务');
      scraper.stopAutoExtract();
    }
  }
});

// 初始化自动提取
initializeAutoExtract();
