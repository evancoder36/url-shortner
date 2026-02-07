class ShortLinkPro {
    constructor() {
        this.links = this.loadLinks();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStats();
        this.renderLinks();
        this.initializeAnimations();
        this.initializeTheme();
    }

    bindEvents() {
        const urlForm = document.getElementById('urlForm');
        const copyBtn = document.getElementById('copyBtn');
        const advancedToggle = document.getElementById('advancedToggle');
        const themeToggle = document.getElementById('themeToggle');
        const testLink = document.getElementById('testLink');
        const qrBtn = document.getElementById('qrBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const exportBtn = document.getElementById('exportBtn');
        const closeModal = document.getElementById('closeModal');
        const downloadQR = document.getElementById('downloadQR');

        urlForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        copyBtn.addEventListener('click', () => this.copyToClipboard());
        advancedToggle.addEventListener('click', () => this.toggleAdvanced());
        themeToggle.addEventListener('click', () => this.toggleTheme());
        testLink.addEventListener('click', (e) => this.handleTestLink(e));
        qrBtn.addEventListener('click', () => this.generateQRCode());
        clearAllBtn.addEventListener('click', () => this.clearAllLinks());
        exportBtn.addEventListener('click', () => this.exportLinks());
        closeModal.addEventListener('click', () => this.closeModal());
        downloadQR.addEventListener('click', () => this.downloadQRCode());

        // Close modal on backdrop click
        document.getElementById('qrModal').addEventListener('click', (e) => {
            if (e.target.id === 'qrModal') this.closeModal();
        });

        // URL input validation
        const urlInput = document.getElementById('urlInput');
        urlInput.addEventListener('input', () => this.validateUrlInput(urlInput));
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

    generateShortUrl(shortCode) {
        return `evanlinks.com/${shortCode}`;
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
        
        const reservedWords = ['www', 'api', 'admin', 'help', 'about', 'contact', 'index', 'redirect', 'app'];
        if (reservedWords.includes(domain.toLowerCase())) {
            throw new Error(`'${domain}' is a reserved word and cannot be used as a custom ID`);
        }
        
        if (this.links.some(link => link.shortCode === domain)) {
            throw new Error('This custom ID is already taken');
        }
        
        return domain;
    }

    async handleFormSubmit(e) {
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

            this.setButtonLoading(shortenBtn, true);

            await new Promise(resolve => setTimeout(resolve, 500));

            const linkData = this.shortenUrl(validatedUrl, customDomain);
            this.showResult(linkData);
            
            urlInput.value = '';
            customDomainInput.value = '';
            this.showToast('Link shortened successfully!', 'success');
            
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setButtonLoading(document.getElementById('shortenBtn'), false);
        }
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
            this.updateStats();

            return linkData;
        } catch (error) {
            throw error;
        }
    }

    showResult(linkData) {
        const resultSection = document.getElementById('resultSection');
        const shortUrlInput = document.getElementById('shortUrl');
        const originalUrlSpan = document.getElementById('originalUrl');
        const createdTimeSpan = document.getElementById('createdTime');
        const testLink = document.getElementById('testLink');
        
        shortUrlInput.value = linkData.shortUrl;
        originalUrlSpan.textContent = this.truncateUrl(linkData.originalUrl);
        createdTimeSpan.textContent = new Date(linkData.createdAt).toLocaleString();
        
        testLink.href = `redirect.html#${linkData.shortCode}`;
        
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
            
            this.setButtonLoading(copyBtn, false, '✅ Copied!', true);
            this.showToast('Link copied to clipboard!', 'success');
            
            setTimeout(() => {
                this.setButtonLoading(copyBtn, false, '📋 Copy', false);
            }, 2000);
        } catch (error) {
            this.showToast('Failed to copy link', 'error');
        }
    }

    handleTestLink(e) {
        e.preventDefault();
        const shortCode = e.target.href.split('#')[1];
        this.showToast(`Testing link... Redirecting in 5 seconds`, 'info');
        setTimeout(() => {
            window.open(e.target.href, '_blank');
        }, 1000);
    }

    generateQRCode() {
        const shortUrl = document.getElementById('shortUrl').value;
        if (!shortUrl) return;

        // Simple QR code placeholder (in production, use a real QR library)
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = `
            <div style="
                width: 200px;
                height: 200px;
                background: white;
                border: 2px solid #000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: monospace;
                font-size: 8px;
                padding: 10px;
                text-align: center;
            ">
                QR Code for:<br>${shortUrl}
            </div>
        `;
        
        document.getElementById('qrModal').classList.remove('hidden');
    }

    downloadQRCode() {
        this.showToast('QR code downloaded!', 'success');
        this.closeModal();
    }

    closeModal() {
        document.getElementById('qrModal').classList.add('hidden');
    }

    renderLinks() {
        const linksList = document.getElementById('linksList');
        
        if (this.links.length === 0) {
            linksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>No links yet</h3>
                    <p>Create your first short link above to get started!</p>
                </div>
            `;
            return;
        }

        linksList.innerHTML = this.links.map(link => `
            <div class="link-card">
                <div class="link-header">
                    <a href="redirect.html#${link.shortCode}" target="_blank" class="link-url">
                        ${link.shortUrl}
                    </a>
                    <div class="link-actions">
                        <button class="link-btn" onclick="app.copySpecificLink('${link.shortUrl}')">Copy</button>
                        <button class="link-btn" onclick="app.viewStats('${link.id}')">Stats</button>
                        <button class="link-btn delete" onclick="app.deleteLink('${link.id}')">Delete</button>
                    </div>
                </div>
                <div class="link-original">${link.originalUrl}</div>
                <div class="link-stats">
                    <span>Created: ${new Date(link.createdAt).toLocaleDateString()}</span>
                    <span>Clicks: ${link.clicks || 0}</span>
                </div>
            </div>
        `).join('');
    }

    async copySpecificLink(url) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            this.showToast('Link copied to clipboard!', 'success');
        } catch (error) {
            this.showToast('Failed to copy link', 'error');
        }
    }

    viewStats(id) {
        const link = this.links.find(l => l.id === id);
        if (link) {
            this.showToast(`Stats for ${link.shortUrl}: ${link.clicks} clicks`, 'info');
        }
    }

    deleteLink(id) {
        if (confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
            this.links = this.links.filter(link => link.id !== id);
            this.saveLinks();
            this.renderLinks();
            this.updateStats();
            this.showToast('Link deleted successfully', 'success');
        }
    }

    clearAllLinks() {
        if (this.links.length === 0) {
            this.showToast('No links to clear', 'warning');
            return;
        }

        if (confirm(`Are you sure you want to delete all ${this.links.length} links? This action cannot be undone.`)) {
            this.links = [];
            this.saveLinks();
            this.renderLinks();
            this.updateStats();
            this.showToast('All links cleared successfully', 'success');
        }
    }

    exportLinks() {
        if (this.links.length === 0) {
            this.showToast('No links to export', 'warning');
            return;
        }

        const data = this.links.map(link => ({
            shortUrl: link.shortUrl,
            originalUrl: link.originalUrl,
            clicks: link.clicks,
            createdAt: link.createdAt
        }));

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `shortlinks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Links exported successfully!', 'success');
    }

    updateStats() {
        const totalLinks = this.links.length;
        const totalClicks = this.links.reduce((sum, link) => sum + (link.clicks || 0), 0);
        
        document.getElementById('totalLinks').textContent = totalLinks;
        document.getElementById('totalClicks').textContent = totalClicks;
    }

    toggleAdvanced() {
        const panel = document.getElementById('advancedPanel');
        const toggle = document.getElementById('advancedToggle');
        
        panel.classList.toggle('hidden');
        toggle.classList.toggle('active');
    }

    validateUrlInput(input) {
        const isValid = input.value && 
                       (input.value.startsWith('http://') || input.value.startsWith('https://') || 
                        input.value.includes('.') || input.value.includes('localhost'));
        
        input.style.borderColor = isValid ? 'var(--border)' : 'var(--error)';
    }

    setButtonLoading(button, loading, text = null, temp = false) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="btn-icon">⏳</span> <span class="btn-text">Processing...</span>';
        } else {
            button.disabled = false;
            if (text) {
                button.innerHTML = `<span class="btn-icon">${text.includes('✅') ? '✅' : '📋'}</span> <span class="btn-text">${text}</span>`;
            } else {
                button.innerHTML = '<span class="btn-icon">✨</span> <span class="btn-text">Shorten</span>';
            }
        }
    }

    initializeAnimations() {
        // Smooth scroll behavior
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Lazy loading animation
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.link-card').forEach(card => {
            observer.observe(card);
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    saveLinks() {
        localStorage.setItem('evansLinks_links', JSON.stringify(this.links));
    }

    loadLinks() {
        const stored = localStorage.getItem('evansLinks_links');
        return stored ? JSON.parse(stored) : [];
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('evansLinks_theme') || 'light';
        this.setTheme(savedTheme);
        this.updateThemeToggle(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.setTheme(newTheme);
        this.updateThemeToggle(newTheme);
        localStorage.setItem('evansLinks_theme', newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.classList.toggle('dark-theme', theme === 'dark');
    }

    updateThemeToggle(theme) {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        const themeText = themeToggle.querySelector('.theme-text');
        
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShortLinkPro();
});

// Make functions globally accessible for onclick handlers
window.copySpecificLink = (url) => app.copySpecificLink(url);
window.viewStats = (id) => app.viewStats(id);
window.deleteLink = (id) => app.deleteLink(id);