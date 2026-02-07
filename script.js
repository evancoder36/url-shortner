class LinkShortener {
    constructor() {
        this.links = this.loadLinks();
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderLinks();
    }

    bindEvents() {
        const urlForm = document.getElementById('urlForm');
        const copyBtn = document.getElementById('copyBtn');
        
        urlForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    generateShortCode(customDomain = null) {
        if (customDomain && customDomain.trim()) {
            return this.validateCustomDomain(customDomain.trim());
        }
        
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            result = '';
            for (let i = 0; i < 3; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            attempts++;
        } while (this.links.some(link => link.shortCode === result) && attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            throw new Error('Unable to generate unique short code. Please try a custom ID.');
        }
        
        return result;
    }

    validateCustomDomain(domain) {
        if (!domain || domain.trim() === '') {
            throw new Error('Custom ID cannot be empty');
        }
        
        domain = domain.trim();
        
        const validPattern = /^[a-zA-Z0-9-_]+$/;
        if (!validPattern.test(domain)) {
            throw new Error('Custom ID can only contain letters, numbers, hyphens, and underscores');
        }
        
        if (domain.length > 20) {
            throw new Error('Custom ID must be 20 characters or less');
        }
        
        if (domain.length < 1) {
            throw new Error('Custom ID must be at least 1 character long');
        }
        
        const reservedWords = ['www', 'api', 'admin', 'help', 'about', 'contact', 'index', 'redirect'];
        if (reservedWords.includes(domain.toLowerCase())) {
            throw new Error(`'${domain}' is a reserved word and cannot be used as a custom ID`);
        }
        
        if (this.links.some(link => link.shortCode === domain)) {
            throw new Error('This custom ID is already taken');
        }
        
        return domain;
    }

    generateShortUrl(shortCode) {
        return `evanlinks.com/${shortCode}`;
    }

    shortenUrl(originalUrl, customDomain = null) {
        try {
            const shortCode = this.generateShortCode(customDomain);
            const shortUrl = this.generateShortUrl(shortCode);
            
            const linkData = {
                id: Date.now().toString(),
                originalUrl,
                shortCode,
                shortUrl,
                customDomain: customDomain || null,
                createdAt: new Date().toISOString(),
                clicks: 0
            };

            this.links.unshift(linkData);
            this.saveLinks();
            this.renderLinks();

            return linkData;
        } catch (error) {
            throw error;
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const urlInput = document.getElementById('urlInput');
        const customDomainInput = document.getElementById('customDomain');
        const shortenBtn = document.getElementById('shortenBtn');
        
        try {
            const originalUrl = urlInput.value.trim();
            const customDomain = customDomainInput.value.trim();

            if (!originalUrl) {
                this.showToast('Please enter a URL', 'error');
                return;
            }

            const validatedUrl = this.validateUrl(originalUrl);
            
            if (this.links.some(link => link.originalUrl === validatedUrl)) {
                const existingLink = this.links.find(link => link.originalUrl === validatedUrl);
                this.showToast(`This URL was already shortened: ${existingLink.shortUrl}`, 'info');
                this.showResult(existingLink);
                return;
            }

            shortenBtn.disabled = true;
            shortenBtn.textContent = 'Shortening...';

            setTimeout(() => {
                try {
                    const linkData = this.shortenUrl(validatedUrl, customDomain);
                    this.showResult(linkData);
                    
                    urlInput.value = '';
                    customDomainInput.value = '';
                    
                    this.showToast('Link shortened successfully!', 'success');
                } catch (error) {
                    this.showToast(error.message, 'error');
                } finally {
                    shortenBtn.disabled = false;
                    shortenBtn.textContent = 'Shorten';
                }
            }, 300);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    validateUrl(url) {
        if (!url || url.trim() === '') {
            throw new Error('URL cannot be empty');
        }
        
        url = url.trim();
        
        if (url.length > 2048) {
            throw new Error('URL is too long (maximum 2048 characters)');
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        try {
            const urlObj = new URL(url);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                throw new Error('Only HTTP and HTTPS URLs are allowed');
            }
            return url;
        } catch (e) {
            throw new Error('Please enter a valid URL (e.g., https://example.com)');
        }
    }

    showResult(linkData) {
        const resultSection = document.getElementById('resultSection');
        const shortUrlInput = document.getElementById('shortUrl');
        const originalUrlSpan = document.getElementById('originalUrl');
        const createdTimeSpan = document.getElementById('createdTime');
        const testLink = document.getElementById('testLink');
        const testNowBtn = document.getElementById('testNowBtn');
        const countdownSpan = document.getElementById('countdown');
        
        shortUrlInput.value = linkData.shortUrl;
        originalUrlSpan.textContent = this.truncateUrl(linkData.originalUrl);
        createdTimeSpan.textContent = new Date(linkData.createdAt).toLocaleString();
        
        // Set up test link
        testLink.href = `redirect.html#${linkData.shortCode}`;
        
        // Set up test now button
        testNowBtn.onclick = () => {
            window.location.href = `redirect.html#${linkData.shortCode}`;
        };
        
        // Set up countdown link
        testLink.onclick = (e) => {
            e.preventDefault();
            this.startCountdown(linkData.shortCode, countdownSpan, testLink);
        };
        
        resultSection.classList.remove('hidden');
        
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    truncateUrl(url) {
        return url.length > 50 ? url.substring(0, 47) + '...' : url;
    }

    async copyToClipboard() {
        const shortUrlInput = document.getElementById('shortUrl');
        const copyBtn = document.getElementById('copyBtn');
        
        if (!shortUrlInput || !shortUrlInput.value) {
            this.showToast('No link to copy', 'error');
            return;
        }
        
        // Always copy the evanlinks.com version
        const cleanUrl = shortUrlInput.value;
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(cleanUrl);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = cleanUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            copyBtn.textContent = '✅ Copied!';
            copyBtn.classList.add('copied');
            
            this.showToast('Demo link copied! For testing, use app.html#shortcode', 'info');
            
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
                copyBtn.classList.remove('copied');
            }, 3000);
        } catch (error) {
            this.showToast('Failed to copy link. Please try selecting and copying manually.', 'error');
        }
    }

    renderLinks() {
        const linksList = document.getElementById('linksList');
        
        if (this.links.length === 0) {
            linksList.innerHTML = '<p class="no-links">No links yet. Create your first short link above!</p>';
            return;
        }

        linksList.innerHTML = this.links.map(link => {
            const displayUrl = `evanlinks.com/${link.shortCode}`;
            return `
            <div class="link-item" data-id="${link.id}">
                <div class="link-item-header">
                    <a href="redirect.html#${link.shortCode}" target="_blank" class="short-link">
                        ${displayUrl}
                    </a>
                    <div class="link-actions">
                        <button class="link-btn copy-link-btn" data-url="${link.shortUrl}">Copy</button>
                        <button class="link-btn delete delete-link-btn" data-id="${link.id}">Delete</button>
                    </div>
                </div>
                <div class="link-original">${link.originalUrl}</div>
                <div class="link-date">
                    Created: ${new Date(link.createdAt).toLocaleDateString()} • 
                    Clicks: ${link.clicks}
                </div>
            </div>
        `;}).join('');

        this.bindLinkEvents();
    }

    bindLinkEvents() {
        document.querySelectorAll('.copy-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.dataset.url;
                this.copyLink(url);
            });
        });

        document.querySelectorAll('.delete-link-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteLink(id);
            });
        });

        // No need to override click behavior for short links anymore
        // They now link directly to redirect.html
    }

    async copyLink(url) {
        if (!url) {
            this.showToast('No link to copy', 'error');
            return;
        }
        
        // Extract the short code and create evanlinks.com version
        const shortCode = url.split('/').pop();
        const cleanUrl = `evanlinks.com/${shortCode}`;
        
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(cleanUrl);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = cleanUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            this.showToast('Demo link copied! For testing, use app.html#shortcode', 'info');
        } catch (error) {
            this.showToast('Failed to copy link. Please try selecting and copying manually.', 'error');
        }
    }

    deleteLink(id) {
        if (confirm('Are you sure you want to delete this link?')) {
            this.links = this.links.filter(link => link.id !== id);
            this.saveLinks();
            this.renderLinks();
            this.showToast('Link deleted successfully', 'success');
        }
    }

    saveLinks() {
        localStorage.setItem('shortenedLinks', JSON.stringify(this.links));
    }

    loadLinks() {
        const stored = localStorage.getItem('shortenedLinks');
        return stored ? JSON.parse(stored) : [];
    }

    startCountdown(shortCode, countdownSpan, testLink) {
        let count = 5;
        countdownSpan.textContent = count;
        
        const interval = setInterval(() => {
            count--;
            countdownSpan.textContent = count;
            
            if (count <= 0) {
                clearInterval(interval);
                window.location.href = `redirect.html#${shortCode}`;
            }
        }, 1000);
        
        this.showToast(`Redirecting in ${count} seconds...`, 'info');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) {
            console.error('Toast element not found');
            return;
        }
        
        toast.textContent = message;
        toast.className = `toast ${type === 'error' ? 'error' : type === 'info' ? 'info' : ''}`;
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function handleRedirect() {
    try {
        const url = window.location.href;
        const shortCode = extractShortCodeFromUrl(url);
        
        if (shortCode && shortCode !== 'index.html' && shortCode !== 'redirect') {
            let links;
            try {
                links = JSON.parse(localStorage.getItem('shortenedLinks') || '[]');
            } catch (e) {
                console.error('Error parsing links from localStorage:', e);
                return false;
            }
            
            const link = links.find(l => l.shortCode === shortCode);
            
            if (link && link.originalUrl) {
                try {
                    new URL(link.originalUrl);
                    
                    link.clicks = (link.clicks || 0) + 1;
                    localStorage.setItem('shortenedLinks', JSON.stringify(links));
                    
                    document.title = 'Redirecting...';
                    document.body.innerHTML = `
                        <div class="redirect-container">
                            <div class="spinner"></div>
                            <h2>Redirecting...</h2>
                            <p>You will be redirected to your destination shortly.</p>
                            <small>Going to: ${link.originalUrl}</small>
                        </div>
                    `;
                    
                        setTimeout(() => {
                            window.location.href = link.originalUrl;
                        }, 1000);
                    
                    return true;
                } catch (urlError) {
                    console.error('Invalid redirect URL:', urlError);
                    return false;
                }
            }
        }
    } catch (error) {
        console.error('Error in handleRedirect:', error);
    }
    
    return false;
}

function extractShortCodeFromUrl(url) {
    try {
        if (url.includes('evanlinks.com/')) {
            const parts = url.split('evanlinks.com/');
            if (parts.length > 1) {
                return parts[1].split('/')[0].split('?')[0].split('#')[0];
            }
        }
        
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const pathParts = pathname.split('/').filter(part => part);
        
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart !== 'index.html' && lastPart !== 'redirect') {
                return lastPart;
            }
        }
    } catch (error) {
        console.error('Error extracting short code:', error);
    }
    
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!handleRedirect()) {
        new LinkShortener();
    }
});