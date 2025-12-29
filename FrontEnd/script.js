document.addEventListener('DOMContentLoaded', () => {
    const modeButtons = document.querySelectorAll('.mode-button');
    const qaSearchInput = document.querySelector('.qa-search-input');
    const documentUpload = document.querySelector('.document-upload');
    const qaInput = document.getElementById('qa-input');
    const documentInput = document.getElementById('document-input');
    const qaForm = document.getElementById('qa-form');
    const documentForm = document.getElementById('document-form');
    const dropZone = document.getElementById('drop-zone');
    const resultsPlaceholder = document.querySelector('.results-placeholder');
    let currentMode = 'qa'; // Default mode
    let uploadedFile = null;
    let typingInterval = null; // To store the typing interval

    // Theme toggle (light/dark)
    const themeToggle = document.getElementById('theme-toggle');
    function applyTheme(theme) {
        if (theme === 'light') document.body.classList.add('light-theme');
        else document.body.classList.remove('light-theme');
        if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'light');
    }
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(savedTheme);

    if (themeToggle) {
        // Allow keyboard activation and save preference
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            const theme = isLight ? 'light' : 'dark';
            localStorage.setItem('theme', theme);
            themeToggle.setAttribute('aria-pressed', isLight);
        });
    }

    // Mode switching
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentMode = button.dataset.mode;

            if (currentMode === 'document') {
                qaSearchInput.classList.remove('active');
                documentUpload.classList.add('active');
                resultsPlaceholder.textContent = `Your document summary will appear here`;
            } else {
                qaSearchInput.classList.add('active');
                documentUpload.classList.remove('active');
                qaInput.placeholder = currentMode === 'qa' 
                    ? 'Ask your legal question...' 
                    : 'Search legal cases...';
                resultsPlaceholder.textContent = `Your ${currentMode === 'qa' ? 'answers' : 'search results'} will appear here`;
            }
        });
    });

    // Simple typing effect function
    function typeText(element, text) {
        // Clear any existing typing interval
        if (typingInterval) {
            clearInterval(typingInterval);
        }
        
        // Clear the element
        element.textContent = '';
        
        // For plain text, do character-by-character typing
        let i = 0;
        typingInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                // Auto-scroll to keep up with the typing
                element.scrollTop = element.scrollHeight;
            } else {
                clearInterval(typingInterval);
                typingInterval = null;
            }
        }, 20); // Adjust typing speed here (lower = faster)
    }
    
    // Type HTML content character by character
    function typeHTML(element, htmlContent) {
        // Clear the element
        element.innerHTML = '';
        
        // Create a DOM parser to work with the HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
        const contentNodes = Array.from(doc.body.firstChild.childNodes);
        
        let currentNodeIndex = 0;
        let currentTextIndex = 0;
        let currentNode = null;
        
        // Clear any existing interval
        if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
        }
        
        // Function to process the next node
        function processNextNode() {
            if (currentNodeIndex >= contentNodes.length) {
                // We've processed all nodes
                clearInterval(typingInterval);
                typingInterval = null;
                return;
            }
            
            currentNode = contentNodes[currentNodeIndex];
            
            if (currentNode.nodeType === Node.TEXT_NODE) {
                // This is a text node, add one character at a time
                if (currentTextIndex < currentNode.textContent.length) {
                    const textFragment = currentNode.textContent.substring(0, currentTextIndex + 1);
                    const existingNode = element.childNodes[element.childNodes.length - 1];
                    
                    if (existingNode && existingNode.nodeType === Node.TEXT_NODE) {
                        existingNode.textContent = textFragment;
                    } else {
                        element.appendChild(document.createTextNode(textFragment));
                    }
                    
                    currentTextIndex++;
                } else {
                    // Move to the next node
                    currentNodeIndex++;
                    currentTextIndex = 0;
                }
            } else {
                // This is an HTML element, add it entirely
                element.appendChild(currentNode.cloneNode(true));
                currentNodeIndex++;
                currentTextIndex = 0;
            }
            
            // Auto-scroll
            element.scrollTop = element.scrollHeight;
        }
        
        // Start the typing interval
        typingInterval = setInterval(processNextNode, 20);
    }// Form submission for Q/A & Search Cases
    qaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputText = qaInput.value.trim();
        if (!inputText) return;

        // Show "Thinking..." message
        resultsPlaceholder.textContent = "Thinking...";

        let apiUrl = `http://127.0.0.1:5000/api/${currentMode}`;
        let requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: inputText })
        };

        try {
            const response = await fetch(apiUrl, requestOptions);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const result = await response.json();
            resultsPlaceholder.innerHTML = ""; // Clear previous results

            if (result.answer) {
                // Display the found case details
                if(currentMode === "search") {
                    const caseDetails = document.createElement("div");
                    caseDetails.style.textAlign = "left";
                    caseDetails.style.fontFamily = "Arial, sans-serif";
                    caseDetails.style.lineHeight = "1.6";
                    caseDetails.style.padding = "10px";
                    resultsPlaceholder.appendChild(caseDetails);
                    
                    // Pretty-print the case details
                    let formattedHTML = "";
                    for (const [key, value] of Object.entries(result.answer)) {
                        let formattedKey = `<strong style="font-size: 16px; color: var(--dark-text);">${key}:</strong> `;
                        if (Array.isArray(value)) {
                            formattedHTML += `${formattedKey}<ul style="margin: 5px 0 10px 20px;">` + 
                                value.map(item => `<li>${item}</li>`).join("") + 
                                `</ul>`;
                        } else {
                            formattedHTML += `<p style="margin: 5px 0;">${formattedKey} ${value}</p>`;
                        }
                    }
                    
                    // Type HTML content character by character
                    typeHTML(caseDetails, formattedHTML);
                    
                    // Add download button after the content is displayed
                    if (result.download_link) {
                        setTimeout(() => {
                            const downloadButton = document.createElement("button");
                            downloadButton.textContent = "Download Case";
                            downloadButton.style.marginTop = "10px";
                            downloadButton.style.padding = "8px 16px";
                            downloadButton.style.cursor = "pointer";

                            // Add event listener for downloading the file
                            downloadButton.addEventListener("click", async () => {
                                const downloadResponse = await fetch(result.download_link);
                                if (downloadResponse.ok) {
                                    const blob = await downloadResponse.blob();
                                    const url = URL.createObjectURL(blob);
                                    // Create an anchor element to trigger the download
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `${inputText}.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                } else {
                                    alert("Failed to download the case file.");
                                }
                            });

                            resultsPlaceholder.appendChild(downloadButton);
                        }, 1000); // Add button after typing animation is likely done
                    }
                } else {
                    // For QA mode - type the text response
                    typeText(resultsPlaceholder, result.answer);
                }
            } else {
                typeText(resultsPlaceholder, "Case not found.");
            }
        } catch (error) {
            console.error('Error:', error);
            typeText(resultsPlaceholder, "Error processing request.");
        }

        qaInput.value = '';
    });

    // Form submission for Document Answering
    documentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputText = "Summarize";
        if (!uploadedFile) {
            alert("Please upload a document");
            return;
        }

        // Show thinking state
        resultsPlaceholder.textContent = "Thinking...";

        let apiUrl = `http://127.0.0.1:5000/api/document`;
        let formData = new FormData();
        formData.append('question', inputText);
        formData.append('file', uploadedFile);

        try {
            const response = await fetch(apiUrl, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const result = await response.json();
            typeText(resultsPlaceholder, result.answer || "No response received.");
        } catch (error) {
            console.error('Error:', error);
            typeText(resultsPlaceholder, "Error processing request.");
        }

        documentInput.value = '';
    });

    // Drag and drop functionality
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadedFile = files[0];
            document.querySelector('.file-name').textContent = uploadedFile.name;
        }
    });

    // Browse files button
    const browseButton = document.querySelector('.browse-button');
    browseButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.txt';
        input.style.display = 'none';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadedFile = file;
                document.querySelector('.file-name').textContent = uploadedFile.name;
            }
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    });
});