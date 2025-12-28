class XiaohongshuScraper {
  constructor() {
    this.posts = [];
  }

  extractPosts() {
    console.log('[XHS Scraper] 开始提取帖子...');
    const noteItems = document.querySelectorAll('.note-item');
    console.log(`[XHS Scraper] 找到 ${noteItems.length} 个帖子元素`);
    
    noteItems.forEach((item, index) => {
      try {
        const post = this.extractPostData(item, index);
        if (post) {
          this.posts.push(post);
          console.log(`[XHS Scraper] 提取帖子 ${index + 1}:`, post.title);
        }
      } catch (error) {
        console.error(`[XHS Scraper] 提取帖子 ${index} 时出错:`, error);
      }
    });

    console.log(`[XHS Scraper] 总共提取了 ${this.posts.length} 个帖子`);
    return this.posts;
  }

  extractPostData(item, index) {
    console.log(`[XHS Scraper] 正在提取第 ${index + 1} 个帖子的数据...`);
    
    const coverImg = item.querySelector('.cover img');
    const titleElement = item.querySelector('.footer .title span');
    const authorElement = item.querySelector('.author-wrapper .author .name');
    const authorAvatarElement = item.querySelector('.author-wrapper .author .author-avatar img');
    const likeCountElement = item.querySelector('.author-wrapper .like-wrapper .count');
    const linkElement = item.querySelector('.cover');

    console.log(`[XHS Scraper] 封面图: ${coverImg ? '找到' : '未找到'}`);
    console.log(`[XHS Scraper] 标题: ${titleElement ? titleElement.textContent.trim() : '未找到'}`);
    console.log(`[XHS Scraper] 作者: ${authorElement ? authorElement.textContent.trim() : '未找到'}`);

    const coverImage = coverImg ? coverImg.src : '';
    const title = titleElement ? titleElement.textContent.trim() : '';
    const author = authorElement ? authorElement.textContent.trim() : '';
    const authorAvatar = authorAvatarElement ? authorAvatarElement.src : '';
    const likeCount = likeCountElement ? likeCountElement.textContent.trim() : '0';
    const postLink = linkElement ? linkElement.href : '';
    const postId = postLink.match(/\/explore\/([a-f0-9]+)/)?.[1] || '';

    if (!coverImage && !title) {
      console.log(`[XHS Scraper] 帖子 ${index + 1} 没有封面图和标题，跳过`);
      return null;
    }

    const postData = {
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
    
    console.log(`[XHS Scraper] 帖子 ${index + 1} 数据提取完成:`, postData);
    return postData;
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
