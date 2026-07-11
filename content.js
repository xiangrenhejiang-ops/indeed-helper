console.log("AI Helper: Dual-Engine Active (Indeed & LinkedIn)!");

let lastClickedJobTitle = "";
let lastClickedCompanyName = "";

// ==================== 1. LINKEDIN 点击追踪 ====================
if (window.location.hostname.includes("linkedin.com")) {
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.job-card-container') || 
                 e.target.closest('.jobs-search-results-list__item') ||
                 e.target.closest('[data-job-id]');
                 
    if (card) {
      const titleEl = card.querySelector('.job-card-list__title') || 
                      card.querySelector('strong') ||
                      card.querySelector('.job-card-container__link');
      const companyEl = card.querySelector('.job-card-container__primary-description') || 
                        card.querySelector('.job-card-container__company-name') ||
                        card.querySelector('.artdeco-entity-lockup__subtitle');

      if (titleEl) lastClickedJobTitle = titleEl.innerText.trim().replace(/\n/g, '');
      if (companyEl) lastClickedCompanyName = companyEl.innerText.trim().replace(/\n/g, '');
      console.log(`[LinkedIn] Locked: ${lastClickedJobTitle} @ ${lastClickedCompanyName}`);
    }
  }, true);
}

// ==================== 2. 消息分发调度器 ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeJob") {
    const hostname = window.location.hostname;

    // ---------------- INDEED 引擎分支 ----------------
    if (hostname.includes("indeed.com")) {
      const titleEl = document.querySelector('.jobsearch-JobInfoHeader-title') || 
                      document.querySelector('.vjs-jobTitle') || 
                      document.querySelector('h1');
                      
      const descEl = document.getElementById('jobDescriptionText') || 
                     document.querySelector('.jobsearch-JobComponent-description');

      if (descEl && descEl.innerText.trim().length > 50) {
        let jobTitle = titleEl ? titleEl.innerText.trim() : "Indeed Job";
        const compEl = document.querySelector('[data-company-name="true"]') || document.querySelector('.jobsearch-CompanyReview--heading');
        if (compEl) {
          jobTitle += ` (${compEl.innerText.trim()})`;
        }

        sendResponse({
          success: true,
          data: { title: jobTitle, description: descEl.innerText.trim() }
        });
      } else {
        sendResponse({ success: false, error: "Indeed job description pane not detected. Please click on a job card." });
      }
    } 
    
    // ---------------- LINKEDIN 引擎分支 ----------------
    else if (hostname.includes("linkedin.com")) {
      // 【修改1】移除 'main' 标签兜底，防止把整个网页的左侧列表全抓进去
      const detailContainer = document.querySelector('.jobs-search-two-pane__details') || 
                              document.querySelector('.scaffold-layout__detail');

      let jobTitle = "";
      let jobDescription = "";

      if (detailContainer) {
        if (lastClickedJobTitle) {
          jobTitle = lastClickedCompanyName ? `${lastClickedJobTitle} (${lastClickedCompanyName})` : lastClickedJobTitle;
        } else {
          const rightTitle = detailContainer.querySelector('.job-details-jobs-unified-top-card__job-title') || 
                             detailContainer.querySelector('.jobs-unified-top-card__job-title') ||
                             detailContainer.querySelector('h1');
          if (rightTitle) jobTitle = rightTitle.innerText.trim();
        }

        // 【修改2】只精准抓取真正的描述块，不留任何获取全文 innerText 的活口
        const jdTarget = detailContainer.querySelector('#job-details') || 
                         detailContainer.querySelector('.jobs-description-content__text') ||
                         document.querySelector('#job-details');

        if (jdTarget) {
          jobDescription = jdTarget.innerText.trim();
        }
      }

      // 【修改3】严格校验：拿不到干净的长文本描述，直接拒绝提交，不给 AI 发送污染数据的机会
      if (jobDescription && jobDescription.length > 100) {
        if (!jobTitle) jobTitle = "Selected LinkedIn Job";
        sendResponse({ 
          success: true, 
          data: { title: jobTitle, description: jobDescription } 
        });
      } else {
        sendResponse({ 
          success: false, 
          error: "LinkedIn content is still loading. Please click 'See more' or click the job card again to refresh." 
        });
      }
    } 
    
    else {
      sendResponse({ success: false, error: "Unsupported job board." });
    }
  }
  return true;
});