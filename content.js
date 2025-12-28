class XiaohongshuScraper {
  constructor() {
    this.posts = [];
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
        console.error(`提取帖子 ${index} 时出错:`, error);
      }
    });

    return this.posts;
  }

  extractPostData(item, index) {
    const coverImg = item.querySelector('.cover img');
    const titleElement = item.querySelector('.footer .title span');
    const authorElement = item.querySelector('.author-wrapper .author .name');
    const authorAvatarElement = item.querySelector('.author-wrapper .author .author-avatar img');
    const likeCountElement = item.querySelector('.author-wrapper .like-wrapper .count');
    const linkElement = item.querySelector('.cover');

    const coverImage = coverImg ? coverImg.src : '';
    const title = titleElement ? titleElement.textContent.trim() : '';
    const author = authorElement ? authorElement.textContent.trim() : '';
    const authorAvatar = authorAvatarElement ? authorAvatarElement.src : '';
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

  listenForNewPosts() {
    const observer = new MutationObserver((mutations) => {
      let hasNewPosts = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList?.contains('note-item')) {
              hasNewPosts = true;
            }
          });
        }
      });

      if (hasNewPosts) {
        this.posts = this.extractPosts();
        chrome.runtime.sendMessage({
          type: 'POSTS_UPDATED',
          posts: this.posts
        });
      }
    });

    const feedsContainer = document.getElementById('exploreFeeds');
    if (feedsContainer) {
      observer.observe(feedsContainer, {
        childList: true,
        subtree: true
      });
    }

    return observer;
  }
}

const scraper = new XiaohongshuScraper();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_POSTS') {
    const posts = scraper.extractPosts();
    sendResponse({ success: true, posts: posts });
  }
});

window.addEventListener('load', () => {
  scraper.listenForNewPosts();
});
