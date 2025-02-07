document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('headlines-generator');
    const generatedContent = document.getElementById('generated-content');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect form data
        const companyName = document.getElementById('company-name').value.trim();
        const product = document.getElementById('product').value.trim();
        const platform = document.querySelector('input[name="platform"]:checked')?.value;
        const contentType = document.querySelector('input[name="content-type"]:checked')?.value;

        // Validate form data
        if (!validateForm(companyName, product, platform, contentType)) {
            return;
        }

        // Prepare request data
        const requestData = {
            companyName,
            product,
            platform,
            contentType
        };

        // Show loading state
        showLoadingState();

        try {
            // Send request to backend
            const response = await generateHeadlines(requestData);
            
            // Display generated content
            displayHeadlines(response, platform, contentType);
        } catch (error) {
            // Handle any errors
            displayError(error);
        }
    });

    // Form validation function
    function validateForm(companyName, product, platform, contentType) {
        const errors = [];

        if (!companyName) errors.push('Company Name');
        if (!product) errors.push('Product');
        if (!platform) errors.push('Platform');
        if (!contentType) errors.push('Content Type');

        if (errors.length > 0) {
            generatedContent.innerHTML = `
                <div class="error-message">
                    Please fill out the following fields: ${errors.join(', ')}
                </div>
            `;
            return false;
        }

        return true;
    }

    // Generate headlines API call
    async function generateHeadlines(data) {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Check if response is successful
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Parse and return JSON response
        return response.json();
    }

    // Show loading state
    function showLoadingState() {
        generatedContent.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner">🔄</div>
                Generating AI Headlines...
            </div>
        `;
    }

    // Display generated headlines
    function displayHeadlines(response, platform, contentType) {
        // Validate response
        if (!response || !response.headlines || !Array.isArray(response.headlines)) {
            throw new Error('Invalid response format');
        }

        if (response.headlines.length > 0) {
            const headlinesHTML = response.headlines.map((headline, index) => 
                `<div class="generated-headline">${index + 1}. ${headline}</div>`
            ).join('');

            generatedContent.innerHTML = `
                <div class="headlines-result">
                    <h3>Generated ${contentType} for ${platform}:</h3>
                    ${headlinesHTML}
                </div>
            `;
        } else {
            generatedContent.innerHTML = `
                <div class="error-message">
                    No headlines could be generated. Please try again.
                </div>
            `;
        }
    }

    // Error handling function
    function displayError(error) {
        console.error('Headlines Generation Error:', error);
        generatedContent.innerHTML = `
            <div class="error-message">
                Oops! Something went wrong. 
                Error: ${error.message}
                Please check your connection and try again.
            </div>
        `;
    }
});