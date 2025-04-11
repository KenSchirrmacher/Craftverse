Auto Resume Script

// Ultra-simple Cursor Auto Resume Script - Copy & paste into browser console
(function() {
    console.log('Cursor Auto Resume: Running');
    
    // Track last click time to avoid multiple clicks
    let lastClickTime = 0;
    
    // Main function that looks for and clicks the resume link
    function clickResumeLink() {
        // Prevent clicking too frequently (3 second cooldown)
        const now = Date.now();
        if (now - lastClickTime < 3000) return;
        
        // Find elements with rate limit text
        const elements = document.querySelectorAll('body *');
        for (const el of elements) {
            if (!el || !el.textContent) continue;
            
            // Check if element contains rate limit text
            if (el.textContent.includes('stop the agent after 25 tool calls') || 
                el.textContent.includes('Note: we default stop')) {
                
                // Find the resume link inside this element
                const links = el.querySelectorAll('a, span.markdown-link, [role="link"], [data-link]');
                for (const link of links) {
                    if (link.textContent.trim() === 'resume the conversation') {
                        console.log('Clicking "resume the conversation" link');
                        link.click();
                        lastClickTime = now;
                        return;
                    }
                }
            }
        }
    }
    
    // Run periodically
    setInterval(clickResumeLink, 1000);
    
    // Also run once immediately
    clickResumeLink();
    
})(); 