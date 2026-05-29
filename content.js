// content.js - Langester DOM Scraper and Injector Script

console.log("⚡ Langester Co-Pilot Content Script Active.");

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "SCRAPE_YOUTUBE_STUDIO") {
    try {
      // Find YouTube Studio title & description editors
      const titleEl = document.querySelector("#title-textarea #textbox") || 
                      document.querySelector('ytcp-mention-textarea[label*="제목"] #textbox') ||
                      document.querySelector('ytcp-mention-textarea[label*="Title"] #textbox');
                      
      const descEl = document.querySelector("#description-textarea #textbox") || 
                     document.querySelector('ytcp-mention-textarea[label*="설명"] #textbox') ||
                     document.querySelector('ytcp-mention-textarea[label*="Description"] #textbox');
      
      sendResponse({
        success: true,
        title: titleEl ? titleEl.innerText : "",
        description: descEl ? descEl.innerText : ""
      });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  
  else if (message.action === "INJECT_YOUTUBE_STUDIO") {
    try {
      const titleEl = document.querySelector("#title-textarea #textbox") || 
                      document.querySelector('ytcp-mention-textarea[label*="제목"] #textbox') ||
                      document.querySelector('ytcp-mention-textarea[label*="Title"] #textbox');
                      
      const descEl = document.querySelector("#description-textarea #textbox") || 
                     document.querySelector('ytcp-mention-textarea[label*="설명"] #textbox') ||
                     document.querySelector('ytcp-mention-textarea[label*="Description"] #textbox');
      
      let titleInjected = false;
      let descInjected = false;
      
      if (message.title && titleEl) {
        titleEl.focus();
        titleEl.innerText = message.title;
        // Trigger input event to let YouTube React/Polymer know of the changes
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
        titleInjected = true;
      }
      
      if (message.description && descEl) {
        descEl.focus();
        descEl.innerText = message.description;
        descEl.dispatchEvent(new Event('input', { bubbles: true }));
        descInjected = true;
      }
      
      sendResponse({
        success: true,
        titleInjected,
        descInjected
      });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  
  else if (message.action === "SCRAPE_SELECTION") {
    // Return selected text on the webpage
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ success: true, text: selectedText });
  }
  
  return true; // Allow async responses
});
