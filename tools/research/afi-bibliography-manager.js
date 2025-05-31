// tools/afi-bibliography-manager.js
// Complete AFI citation management tool

const fs = require('fs');
const path = require('path');

class AFIBibliographyManager {
    constructor() {
        this.bibliographyPath = path.join(process.cwd(), 'data', 'bibliography.toml');
        this.filmsDir = path.join(process.cwd(), 'content', 'films');
        this.existingBibliography = '';
        this.existingAFI = new Map(); // filmKey -> citation info
        this.allFilms = [];
        this.missingFilms = [];
    }

    // Load and parse existing bibliography
    loadBibliography() {
        try {
            this.existingBibliography = fs.readFileSync(this.bibliographyPath, 'utf8');
            
            // Parse AFI entries - look for blocks with AFI Catalog source
            const blocks = this.existingBibliography.split(/\n\[([^\]]+)\]\n/);
            
            for (let i = 1; i < blocks.length; i += 2) {
                const id = blocks[i];
                const content = blocks[i + 1];
                
                if (content.includes('source = "AFI Catalog of Feature Films"')) {
                    // Extract film info from the citation
                    const titleMatch = content.match(/title = "([^"]+)"/);
                    const urlMatch = content.match(/url = "([^"]+)"/);
                    
                    if (titleMatch) {
                        // Try to extract year from ID (e.g., afi_giant_1956)
                        const yearMatch = id.match(/_(\d{4})$/);
                        if (yearMatch) {
                            const year = yearMatch[1];
                            const filmKey = `${titleMatch[1]}_${year}`;
                            
                            this.existingAFI.set(filmKey, {
                                id,
                                title: titleMatch[1],
                                year: parseInt(year),
                                url: urlMatch ? urlMatch[1] : '',
                                hasValidUrl: urlMatch && !urlMatch[1].includes('XXXXX')
                            });
                        }
                    }
                }
            }
            
            console.log(`✅ Loaded bibliography with ${this.existingAFI.size} AFI entries`);
        } catch (error) {
            console.error('❌ Could not load bibliography.toml:', error.message);
            process.exit(1);
        }
    }

    // Load all film files
    loadFilms() {
        const filmFiles = fs.readdirSync(this.filmsDir)
            .filter(f => f.endsWith('.md') && f !== '_index.md');

        filmFiles.forEach(fileName => {
            const filePath = path.join(this.filmsDir, fileName);
            const content = fs.readFileSync(filePath, 'utf8');
            
            const titleMatch = content.match(/title = "([^"]+)"/);
            const yearMatch = content.match(/year = (\d+)/);
            
            if (titleMatch && yearMatch) {
                const title = titleMatch[1];
                const year = parseInt(yearMatch[1]);
                const filmKey = `${title}_${year}`;
                
                const film = {
                    fileName,
                    title,
                    year,
                    filmKey,
                    citationId: this.generateCitationId(title, year),
                    hasAFI: this.existingAFI.has(filmKey),
                    afiData: this.existingAFI.get(filmKey)
                };
                
                this.allFilms.push(film);
                
                if (!film.hasAFI || (film.afiData && !film.afiData.hasValidUrl)) {
                    this.missingFilms.push(film);
                }
            }
        });

        console.log(`📁 Found ${this.allFilms.length} films total`);
    }

    // Generate citation ID
    generateCitationId(title, year) {
        const titleClean = title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);
        
        return `afi_${titleClean}_${year}`;
    }

    // Generate search URL
    generateSearchUrl(title, year) {
        const cleanTitle = title.replace(/[^\w\s]/g, '');
        const searchQuery = encodeURIComponent(`${cleanTitle} ${year}`);
        return `https://catalog.afi.com/Search?searchField=MovieName&searchText=${searchQuery}`;
    }

    // Analyze current state
    analyzeStatus() {
        const hasValidUrl = Array.from(this.existingAFI.values())
            .filter(afi => afi.hasValidUrl).length;
        const hasPlaceholder = this.existingAFI.size - hasValidUrl;
        const needsEntry = this.missingFilms.length - hasPlaceholder;

        console.log('\n📊 Status Summary:');
        console.log(`   ✅ ${hasValidUrl} films have complete AFI citations`);
        console.log(`   ⚠️  ${hasPlaceholder} films have placeholder AFI citations (need URLs)`);
        console.log(`   ❌ ${needsEntry} films have no AFI citation at all`);
        console.log(`   📝 Total needing attention: ${this.missingFilms.length}\n`);
    }

    // Generate interactive HTML helper
    generateHTML() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>AFI Bibliography Manager</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .stat {
            padding: 10px 20px;
            background: #f0f0f0;
            border-radius: 4px;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
        .bulk-actions {
            position: sticky;
            top: 0;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            z-index: 100;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        .primary-btn {
            background: #3498db;
            color: white;
        }
        .primary-btn:hover {
            background: #2980b9;
        }
        .secondary-btn {
            background: #ecf0f1;
            color: #2c3e50;
        }
        .secondary-btn:hover {
            background: #bdc3c7;
        }
        .film {
            background: white;
            margin-bottom: 15px;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s;
        }
        .film.completed {
            background: #e8f8f5;
            border: 1px solid #27ae60;
        }
        .film.needs-url {
            background: #fef9e7;
            border: 1px solid #f39c12;
        }
        .film-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .title {
            font-weight: bold;
            font-size: 18px;
            color: #2c3e50;
        }
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .status.complete { background: #27ae60; color: white; }
        .status.needs-url { background: #f39c12; color: white; }
        .status.missing { background: #e74c3c; color: white; }
        
        .search-section {
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .search-link {
            display: inline-block;
            margin: 5px 0;
            color: #3498db;
            text-decoration: none;
        }
        .search-link:hover {
            text-decoration: underline;
        }
        input[type="text"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
        }
        input.valid {
            border-color: #27ae60;
            background: #e8f8f5;
        }
        input.invalid {
            border-color: #e74c3c;
            background: #fee;
        }
        .citation-preview {
            margin-top: 10px;
            padding: 10px;
            background: #2c3e50;
            color: #ecf0f1;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            white-space: pre-wrap;
            display: none;
        }
        .hidden { display: none; }
        .progress {
            margin-left: auto;
            font-weight: bold;
            color: #2c3e50;
        }
        code {
            background: #ecf0f1;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎬 AFI Bibliography Manager</h1>
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${this.allFilms.length}</div>
                <div>Total Films</div>
            </div>
            <div class="stat">
                <div class="stat-number complete-count">${this.allFilms.length - this.missingFilms.length}</div>
                <div>Complete</div>
            </div>
            <div class="stat">
                <div class="stat-number missing-count">${this.missingFilms.length}</div>
                <div>Need URLs</div>
            </div>
        </div>
    </div>
    
    <div class="bulk-actions">
        <button class="primary-btn" onclick="copyAllCompleted()">
            📋 Copy All New Citations (<span class="copy-count">0</span>)
        </button>
        <button class="secondary-btn" onclick="toggleCompleted()">
            👁️ <span class="toggle-text">Hide</span> Completed
        </button>
        <button class="secondary-btn" onclick="exportCSV()">
            📊 Export Status CSV
        </button>
        <span class="progress">
            Progress: <span class="progress-count">0</span> / ${this.missingFilms.length}
        </span>
    </div>
    
    <div id="films-container">
        ${this.generateFilmEntries()}
    </div>
    
    <script>
    const films = ${JSON.stringify(this.missingFilms.map(f => ({
        ...f,
        searchUrl: this.generateSearchUrl(f.title, f.year)
    })))};
    
    let completedUrls = new Map();
    let hideCompleted = false;
    
    // Validate AFI URL
    function validateUrl(url) {
        const patterns = [
            /^https:\\/\\/catalog\\.afi\\.com\\/Film\\/\\d+/,
            /^https:\\/\\/catalog\\.afi\\.com\\/Catalog\\/moviedetails\\/\\d+/
        ];
        return patterns.some(pattern => pattern.test(url));
    }
    
    // Handle URL input
    function handleUrlInput(index) {
        const input = document.getElementById('url-' + index);
        const url = input.value.trim();
        const film = films[index];
        
        if (url && validateUrl(url)) {
            input.classList.add('valid');
            input.classList.remove('invalid');
            completedUrls.set(film.citationId, { film, url });
            showPreview(index, film, url);
            updateProgress();
        } else if (url) {
            input.classList.add('invalid');
            input.classList.remove('valid');
            completedUrls.delete(film.citationId);
            hidePreview(index);
            updateProgress();
        } else {
            input.classList.remove('valid', 'invalid');
            completedUrls.delete(film.citationId);
            hidePreview(index);
            updateProgress();
        }
    }
    
    // Show citation preview
    function showPreview(index, film, url) {
        const preview = document.getElementById('preview-' + index);
        const citation = formatCitation(film, url);
        preview.textContent = citation;
        preview.style.display = 'block';
        
        // Update film card status
        const filmCard = document.getElementById('film-' + index);
        filmCard.classList.add('completed');
    }
    
    function hidePreview(index) {
        const preview = document.getElementById('preview-' + index);
        preview.style.display = 'none';
        
        const filmCard = document.getElementById('film-' + index);
        filmCard.classList.remove('completed');
    }
    
    // Format citation
    function formatCitation(film, url) {
        return \`[\${film.citationId}]
type = "online"
title = "\${film.title}"
source = "AFI Catalog of Feature Films"
url = "\${url}"
accessed = "${new Date().toISOString().split('T')[0]}"\`;
    }
    
    // Update progress
    function updateProgress() {
        const count = completedUrls.size;
        document.querySelector('.copy-count').textContent = count;
        document.querySelector('.progress-count').textContent = count;
        document.querySelector('.missing-count').textContent = films.length - count;
        document.querySelector('.complete-count').textContent = ${this.allFilms.length - this.missingFilms.length} + count;
    }
    
    // Copy all completed
    function copyAllCompleted() {
        if (completedUrls.size === 0) {
            alert('No URLs have been added yet!');
            return;
        }
        
        const citations = Array.from(completedUrls.values())
            .sort((a, b) => a.film.year - b.film.year || a.film.title.localeCompare(b.film.title))
            .map(({ film, url }) => formatCitation(film, url))
            .join('\\n\\n');
        
        const header = \`
# =============================================================================
# 📚 AFI CATALOG ENTRIES - Added ${new Date().toISOString().split('T')[0]}
# =============================================================================

\`;
        
        navigator.clipboard.writeText(header + citations).then(() => {
            alert(\`Copied \${completedUrls.size} citations to clipboard!\\n\\nPaste at the end of bibliography.toml\`);
        });
    }
    
    // Toggle completed visibility
    function toggleCompleted() {
        hideCompleted = !hideCompleted;
        document.querySelector('.toggle-text').textContent = hideCompleted ? 'Show' : 'Hide';
        
        completedUrls.forEach(({ film }) => {
            const index = films.findIndex(f => f.citationId === film.citationId);
            if (index !== -1) {
                const filmCard = document.getElementById('film-' + index);
                filmCard.classList.toggle('hidden', hideCompleted);
            }
        });
    }
    
    // Export CSV
    function exportCSV() {
        const rows = [
            ['Title', 'Year', 'Citation ID', 'Status', 'AFI URL']
        ];
        
        films.forEach(film => {
            const completed = completedUrls.get(film.citationId);
            rows.push([
                film.title,
                film.year,
                film.citationId,
                completed ? 'Added' : 'Pending',
                completed ? completed.url : ''
            ]);
        });
        
        const csv = rows.map(row => row.map(cell => 
            typeof cell === 'string' && cell.includes(',') ? \`"\${cell}"\` : cell
        ).join(',')).join('\\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`afi-citations-\${new Date().toISOString().split('T')[0]}.csv\`;
        a.click();
    }
    
    // Save/load from localStorage
    function saveProgress() {
        const data = Array.from(completedUrls.entries());
        localStorage.setItem('afiProgress', JSON.stringify(data));
    }
    
    function loadProgress() {
        const saved = localStorage.getItem('afiProgress');
        if (saved) {
            const data = JSON.parse(saved);
            data.forEach(([id, value]) => {
                completedUrls.set(id, value);
                const index = films.findIndex(f => f.citationId === id);
                if (index !== -1) {
                    document.getElementById('url-' + index).value = value.url;
                    handleUrlInput(index);
                }
            });
        }
    }
    
    // Auto-save on changes
    window.addEventListener('beforeunload', saveProgress);
    
    // Load saved progress on start
    loadProgress();
    </script>
</body>
</html>`;

        const outputPath = path.join('reports', 'afi-manager.html');
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Generated interactive manager: ${outputPath}`);
    }

    // Generate film entries for HTML
    generateFilmEntries() {
        return this.missingFilms.map((film, index) => {
            const needsUrl = film.afiData && !film.afiData.hasValidUrl;
            const statusClass = needsUrl ? 'needs-url' : 'missing';
            const statusText = needsUrl ? 'Needs URL' : 'Missing';
            
            return `
            <div class="film ${needsUrl ? 'needs-url' : ''}" id="film-${index}">
                <div class="film-header">
                    <div class="title">${film.title} (${film.year})</div>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
                
                <div>Citation ID: <code>${film.citationId}</code></div>
                
                <div class="search-section">
                    <div>Search for this film on AFI:</div>
                    <a href="${this.generateSearchUrl(film.title, film.year)}" 
                       target="_blank" 
                       class="search-link">
                        🔍 Search AFI Catalog
                    </a>
                    ${needsUrl && film.afiData.url ? `
                    <div style="margin-top: 10px; color: #e74c3c;">
                        Current placeholder URL: <code>${film.afiData.url}</code>
                    </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 10px;">
                    <label>AFI URL:</label>
                    <input type="text" 
                           id="url-${index}" 
                           placeholder="Paste the AFI catalog URL here"
                           onchange="handleUrlInput(${index})"
                           onkeyup="handleUrlInput(${index})">
                </div>
                
                <div class="citation-preview" id="preview-${index}"></div>
            </div>
            `;
        }).join('');
    }

    // Main execution
    async run() {
        console.log('🎬 AFI Bibliography Manager\n');
        
        // Ensure reports directory
        if (!fs.existsSync('reports')) {
            fs.mkdirSync('reports');
        }
        
        // Load and analyze
        this.loadBibliography();
        this.loadFilms();
        this.analyzeStatus();
        
        if (this.missingFilms.length > 0) {
            this.generateHTML();
            console.log('📋 Open reports/afi-manager.html in your browser to manage citations');
            console.log('   - Search for films on AFI Catalog');
            console.log('   - Paste URLs to generate citations');
            console.log('   - Copy all completed citations at once');
            console.log('   - Progress is auto-saved!\n');
        } else {
            console.log('🎉 All films have complete AFI citations!');
        }
    }
}

// Run the tool
if (require.main === module) {
    const manager = new AFIBibliographyManager();
    manager.run();
}

module.exports = AFIBibliographyManager;