console.log("Indeed & LinkedIn AI Helper content script injected!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrapeJob") {
    
    const currentUrl = window.location.hostname;
    let jobTitle = "Unknown Job Title";
    let jobDescription = "";

    if (currentUrl.includes("indeed.com")) {
      const titleElement = document.querySelector('.jobsearch-JobInfoHeader-title') || document.querySelector('h1');
      jobTitle = titleElement ? titleElement.innerText.trim() : "Unknown Indeed Job";
      const jdElement = document.getElementById('jobDescriptionText');
      jobDescription = jdElement ? jdElement.innerText.trim() : "";

    } else if (currentUrl.includes("linkedin.com")) {
      const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title') || 
                           document.querySelector('.jobs-unified-top-card__job-title') ||
                           document.querySelector('.jobs-search-two-pane__details h1') ||
                           document.querySelector('h1');
      jobTitle = titleElement ? titleElement.innerText.trim() : "Unknown LinkedIn Job";

      const selectors = [
        '.jobs-description-content__text', 
        '#job-details', 
        '.jobs-description__container',
        '.jobs-box__html-content',
        '.jobs-search-two-pane__details'
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.trim().length > 100) {
          jobDescription = el.innerText.trim();
          break;
        }
      }

      if (!jobDescription) {
        const fullText = document.body.innerText;
        const match = fullText.match(/about the job/i);
        if (match && match.index !== undefined) {
          jobDescription = fullText.substring(match.index, match.index + 4000).trim();
        }
      }
    }

    if (!jobDescription) {
      sendResponse({ 
        success: false, 
        error: "Job description not found. Please try clicking 'See more' on the job post first." 
      });
    } else {
      sendResponse({
        success: true,
        data: { title: jobTitle, description: jobDescription }
      });
    }
  }
  return true;
});