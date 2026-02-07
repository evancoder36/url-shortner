class ShortLinkPro {
    constructor() {
        this.links = this.loadLinks();
        this.currentFilter = '';
        this.currentAnalyticsFilter = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStats();
        this.renderLinks();
        this.updateAnalytics();
        this.initializeAnimations();
        this.initializeTheme();
        this.setMinExpiryDate();
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
        const togglePassword = document.getElementById('togglePassword');
        const linkPassword = document.getElementById('linkPassword');
        const expiryDate = document.getElementById('expiryDate');
        const linkCategory = document.getElementById('linkCategory');
        const categoryFilter = document.getElementById('categoryFilterLinks');
        const categoryFilterLinks = document.getElementById('categoryFilterLinks');
        const refreshAnalytics = document.getElementById('refreshAnalytics');

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
        togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        linkPassword.addEventListener('input', () => this.validatePassword());
        expiryDate.addEventListener('change', () => this.validateExpiryDate());
        linkCategory.addEventListener('change', () => this.updateAnalytics());
        categoryFilter.addEventListener('change', (e) => this.filterLinks(e.target.value));
        categoryFilterLinks.addEventListener('change', (e) => this.filterLinks(e.target.value));
        refreshAnalytics.addEventListener('click', () => this.updateAnalytics());

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
        return `${window.location.host}${window.location.pathname.replace(/\/[^/]*$/, '')}/redirect.html#${shortCode}`;
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

    async     handleFormSubmit(e) {
        e.preventDefault();
        
        const urlInput = document.getElementById('urlInput');
        const customDomainInput = document.getElementById('customDomain');
        const linkPasswordInput = document.getElementById('linkPassword');
        const expiryDateInput = document.getElementById('expiryDate');
        const categoryInput = document.getElementById('linkCategory');
        const shortenBtn = document.getElementById('shortenBtn');
        
        try {
            const originalUrl = urlInput.value.trim();
            const customDomain = customDomainInput.value.trim();
            const password = linkPasswordInput.value.trim() || null;
            const expiryDate = expiryDateInput.value || null;
            const category = categoryInput.value || null;

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

            const linkData = this.shortenUrl(validatedUrl, customDomain, password, expiryDate, category);
            this.showResult(linkData);
            
            // Reset form
            urlInput.value = '';
            customDomainInput.value = '';
            linkPasswordInput.value = '';
            expiryDateInput.value = '';
            categoryInput.value = '';
            
            this.showToast('Link shortened successfully!', 'success');
            
        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.setButtonLoading(document.getElementById('shortenBtn'), false);
        }
    }

    shortenUrl(originalUrl, customDomain = null, password = null, expiryDate = null, category = null) {
        try {
            const shortCode = this.generateShortCode(customDomain);
            const shortUrl = this.generateShortUrl(shortCode);
            
            const linkData = {
                id: Date.now().toString(),
                originalUrl,
                shortCode,
                shortUrl,
                customDomain: customDomain || null,
                password: password,
                expiryDate: expiryDate,
                category: category,
                createdAt: new Date().toISOString(),
                clicks: 0
            };

            this.links.unshift(linkData);
            this.saveLinks();
            this.renderLinks();
            this.updateStats();
            this.updateAnalytics();

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
        const filteredLinks = this.getFilteredLinks();
        
        if (filteredLinks.length === 0) {
            linksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>No links yet</h3>
                    <p>Create your first short link above to get started!</p>
                </div>
            `;
            return;
        }

        linksList.innerHTML = filteredLinks.map(link => {
            const isExpired = this.isLinkExpired(link);
            const expiryStatus = isExpired ? 'expired' : 'active';
            const statusIcon = isExpired ? '⚠️' : '✅';
            const passwordIcon = link.password ? '🔒' : '🔓';
            
            return `
            <div class="link-card ${isExpired ? 'expired' : ''}">
                <div class="link-header">
                    <a href="redirect.html#${link.shortCode}" target="_blank" class="link-url ${isExpired ? 'expired-link' : ''}">
                        ${link.shortUrl}
                    </a>
                    <div class="link-actions">
                        <button class="link-btn" onclick="app.copySpecificLink('${link.shortUrl}')" title="Copy Link">📋</button>
                        <button class="link-btn" onclick="app.editLink('${link.id}')" title="Edit Link">✏️</button>
                        <button class="link-btn delete" onclick="app.deleteLink('${link.id}')" title="Delete Link">🗑️</button>
                    </div>
                </div>
                <div class="link-meta">
                    <div class="meta-item">
                        <span class="meta-label">Status:</span>
                        <span class="meta-value ${expiryStatus}">${statusIcon} ${expiryStatus.charAt(0).toUpperCase() + expiryStatus.slice(1)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Protection:</span>
                        <span class="meta-value">${passwordIcon} ${link.password ? 'Password Protected' : 'Public'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Category:</span>
                        <span class="meta-value">${link.category || 'Uncategorized'}</span>
                    </div>
                </div>
                <div class="link-original">${link.originalUrl}</div>
                <div class="link-stats">
                    <span>Created: ${new Date(link.createdAt).toLocaleDateString()}</span>
                    <span>Clicks: ${link.clicks || 0}</span>
                    ${link.expiryDate ? `<span>Expires: ${new Date(link.expiryDate).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `;}).join('');
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

    editLink(id) {
        const link = this.links.find(l => l.id === id);
        if (!link) return;
        
        // Fill form with existing data
        document.getElementById('urlInput').value = link.originalUrl;
        document.getElementById('customDomain').value = link.customDomain || link.shortCode;
        document.getElementById('linkPassword').value = link.password || '';
        document.getElementById('linkCategory').value = link.category || '';
        if (link.expiryDate) {
            document.getElementById('expiryDate').value = link.expiryDate.slice(0, 16);
        }
        
        // Remove the link temporarily (user can cancel)
        this.links = this.links.filter(l => l.id !== id);
        this.saveLinks();
        this.renderLinks();
        
        this.showToast('Edit the link and submit to update', 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    deleteLink(id) {
        if (confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
            this.links = this.links.filter(link => link.id !== id);
            this.saveLinks();
            this.renderLinks();
            this.updateStats();
            this.updateAnalytics();
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

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('linkPassword');
        const toggleBtn = document.getElementById('togglePassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = '👁️';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    }

    validatePassword() {
        const passwordInput = document.getElementById('linkPassword');
        const password = passwordInput.value.trim();
        
        if (password.length > 0 && password.length < 4) {
            passwordInput.style.borderColor = 'var(--warning)';
        } else {
            passwordInput.style.borderColor = 'var(--border)';
        }
    }

    setMinExpiryDate() {
        const expiryInput = document.getElementById('expiryDate');
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        expiryInput.min = tomorrow.toISOString().slice(0, 16);
    }

    validateExpiryDate() {
        const expiryInput = document.getElementById('expiryDate');
        const expiryDate = expiryInput.value;
        
        if (expiryDate) {
            const expiry = new Date(expiryDate);
            const now = new Date();
            
            if (expiry <= now) {
                expiryInput.style.borderColor = 'var(--error)';
                this.showToast('Expiry date must be in the future', 'error');
            } else {
                expiryInput.style.borderColor = 'var(--border)';
            }
        }
    }

    isLinkExpired(link) {
        if (!link.expiryDate) return false;
        
        const now = new Date();
        const expiry = new Date(link.expiryDate);
        
        return expiry <= now;
    }

    filterLinks(category) {
        this.currentFilter = category;
        this.renderLinks();
        this.updateAnalytics();
    }

    updateAnalytics() {
        this.renderAnalyticsDashboard();
        this.renderAnalyticsCharts();
    }

    renderAnalyticsDashboard() {
        const filteredLinks = this.getFilteredLinks();
        const totalLinks = filteredLinks.length;
        const totalClicks = filteredLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
        const popularLink = filteredLinks.reduce((max, link) => (link.clicks || 0) > (max.clicks || 0) ? link : max, {});
        const today = new Date();
        const todayLinks = filteredLinks.filter(link => {
            const linkDate = new Date(link.createdAt);
            return linkDate.toDateString() === today.toDateString();
        }).length;
        
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekLinks = filteredLinks.filter(link => new Date(link.createdAt) >= weekAgo).length;

        // Update dashboard cards
        document.getElementById('totalLinksAnalytics').textContent = totalLinks;
        document.getElementById('totalClicksAnalytics').textContent = totalClicks;
        document.getElementById('popularLink').textContent = popularLink.shortUrl || '-';
        document.getElementById('popularClicks').textContent = popularLink.clicks || '0 clicks';
        document.getElementById('todayLinks').textContent = todayLinks;
        document.getElementById('weekLinks').textContent = weekLinks;
        
        // Calculate changes (for demo, show previous values)
        document.getElementById('linksChange').textContent = `+${Math.floor(Math.random() * 5)}`;
        document.getElementById('clicksChange').textContent = `+${Math.floor(Math.random() * 20)}`;
    }

    renderAnalyticsCharts() {
        const filteredLinks = this.getFilteredLinks();
        
        // Category chart
        const categoryData = this.getCategoryAnalytics(filteredLinks);
        this.drawCategoryChart(categoryData);
        
        // Activity chart
        const activityData = this.getActivityData(filteredLinks);
        this.drawActivityChart(activityData);
    }

    getCategoryAnalytics(links) {
        const categories = {};
        
        links.forEach(link => {
            const category = link.category || 'uncategorized';
            const clicks = link.clicks || 0;
            categories[category] = (categories[category] || 0) + clicks;
        });
        
        return categories;
    }

    getActivityData(links) {
        const last7Days = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const dayClicks = links
                .filter(link => new Date(link.createdAt).toDateString() === date.toDateString())
                .reduce((sum, link) => sum + (link.clicks || 0), 0);
            
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                clicks: dayClicks
            });
        }
        
        return last7Days;
    }

    drawCategoryChart(data) {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const labels = Object.keys(data);
        const values = Object.values(data);
        
        // Simple bar chart
        const maxValue = Math.max(...values, 1);
        const barWidth = 40;
        const barSpacing = 10;
        const chartHeight = 150;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        labels.forEach((label, index) => {
            const value = data[label] || 0;
            const barHeight = (value / maxValue) * chartHeight;
            const x = index * (barWidth + barSpacing) + 10;
            const y = chartHeight - barHeight;
            
            // Draw bar
            ctx.fillStyle = '#4F46E5';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            ctx.fillStyle = '#64748B';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + barWidth/2, chartHeight + 15);
            
            // Draw value
            ctx.fillStyle = '#1E293B';
            ctx.fillText(value.toString(), x + barWidth/2, y - 5);
        });
    }

    drawActivityChart(data) {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const chartHeight = 150;
        const maxValue = Math.max(...data.map(d => d.clicks), 1);
        const pointSpacing = 50;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw line
        ctx.strokeStyle = '#4F46E5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = index * pointSpacing + 20;
            const y = chartHeight - (point.clicks / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        data.forEach((point, index) => {
            const x = index * pointSpacing + 20;
            const y = chartHeight - (point.clicks / maxValue) * chartHeight;
            
            ctx.fillStyle = '#4F46E5';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw label
            ctx.fillStyle = '#64748B';
            ctx.font = '9px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(point.date, x, y + 15);
        });
    }

    getFilteredLinks() {
        if (!this.currentFilter) return this.links;
        return this.links.filter(link => link.category === this.currentFilter);
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