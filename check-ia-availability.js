// check-ia-availability.js
// Simple Internet Archive checker for Hollywood Regionalism project

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

class SimpleIAChecker {
    constructor() {
        this.results = [];
        this.rateLimitDelay = 2000; // 2 seconds between requests to be respectful
    }

    // Extract film info from a markdown file
    parseFilmFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract frontmatter (between the +++ markers)
        const frontmatterMatch = content.match(/^\+\+\+\n([\s\S]*?)\n\+\+\+/);
        if (!frontmatterMatch) {
            console.log(`⚠️  No frontmatter found in ${path.basename(filePath)}`);
            return null;
        }

        const frontmatter = frontmatterMatch[1];
        
        // Extract key fields - simple string matching
        const title = this.extractField(frontmatter, 'title');
        const year = this.extractField(frontmatter, 'year');
        const author = this.extractAuthor(frontmatter);
        
        if (!title) {
            console.log(`⚠️  No title found in ${path.basename(filePath)}`);
            return null;
        }

        return {
            filePath,
            fileName: path.basename(filePath),
            title: title.replace(/"/g, ''), // Remove quotes
            year: year ? parseInt(year) : null,
            author
        };
    }

    // Extract a field value from frontmatter
    extractField(content, fieldName) {
        const regex = new RegExp(`^${fieldName}\\s*=\\s*(.+)$`, 'm');
        const match = content.match(regex);
        if (!match) return null;
        
        // Clean up the value (remove quotes, extra spaces)
        return match[1].trim().replace(/^["']|["']$/g, '');
    }

    // Extract author from the authors array
    extractAuthor(content) {
        const match = content.match(/^authors\s*=\s*\[([^\]]*)\]/m);
        if (!match) return null;
        
        // Get first author and clean it up
        const authorsStr = match[1];
        const firstAuthor = authorsStr.split(',')[0];
        return firstAuthor ? firstAuthor.trim().replace(/"/g, '') : null;
    }

    // Make HTTP request using Node.js built-in modules
    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Hollywood-Regionalism-Checker/1.0'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const jsonData = JSON.parse(data);
                            resolve(jsonData);
                        } catch (error) {
                            reject(new Error(`Failed to parse JSON: ${error.message}`));
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    // Search Internet Archive for a film
    async searchIA(filmInfo) {
        console.log(`🔍 Searching for: "${filmInfo.title}" (${filmInfo.year})`);
        
        // Build search query
        let query = `title:(${filmInfo.title})`;
        if (filmInfo.year) {
            query += ` AND year:(${filmInfo.year})`;
        }
        if (filmInfo.author) {
            query += ` AND creator:(${filmInfo.author})`;
        }
        query += ' AND mediatype:movies';

        // Build the URL
        const baseUrl = 'https://archive.org/advancedsearch.php';
        const params = new URLSearchParams({
            q: query,
            fl: 'identifier,title,creator,year,description',
            rows: '10',
            output: 'json'
        });
        
        const searchUrl = `${baseUrl}?${params.toString()}`;
        console.log(`   URL: ${searchUrl}`);

        try {
            // Make the API request using our custom function
            const data = await this.makeRequest(searchUrl);
            const docs = data.response?.docs || [];
            
            console.log(`   Found ${docs.length} results`);
            
            if (docs.length > 0) {
                docs.forEach((doc, index) => {
                    console.log(`   ${index + 1}. "${doc.title}" (${doc.year}) - ID: ${doc.identifier}`);
                });
            }
            
            return docs.map(doc => ({
                identifier: doc.identifier,
                title: doc.title,
                creator: doc.creator,
                year: doc.year,
                description: doc.description,
                watchUrl: `https://archive.org/details/${doc.identifier}`,
                embedUrl: `https://archive.org/embed/${doc.identifier}`
            }));
            
        } catch (error) {
            console.error(`   ❌ Error searching for "${filmInfo.title}":`, error.message);
            return [];
        }
    }

    // Add a delay between requests
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Process a single film
    async processFilm(filmInfo) {
        const iaResults = await this.searchIA(filmInfo);
        
        const result = {
            ...filmInfo,
            foundOnIA: iaResults.length > 0,
            iaResults,
            bestMatch: iaResults[0] || null
        };
        
        this.results.push(result);
        
        // Add delay to be respectful to IA's servers
        await this.delay(this.rateLimitDelay);
        
        return result;
    }

    // Process all film files
    async processAllFilms() {
        const filmsDir = path.join(process.cwd(), 'content', 'films');
        
        if (!fs.existsSync(filmsDir)) {
            console.error(`❌ Films directory not found: ${filmsDir}`);
            console.error('Make sure you\'re running this script from your project root directory.');
            return;
        }

        const filmFiles = fs.readdirSync(filmsDir)
            .filter(file => file.endsWith('.md'))
            .map(file => path.join(filmsDir, file));

        console.log(`📁 Found ${filmFiles.length} film files in ${filmsDir}`);
        console.log('=' .repeat(60));

        // Process each file
        for (let i = 0; i < filmFiles.length; i++) {
            const filePath = filmFiles[i];
            console.log(`\n[${i + 1}/${filmFiles.length}] Processing ${path.basename(filePath)}`);
            
            const filmInfo = this.parseFilmFile(filePath);
            if (filmInfo) {
                await this.processFilm(filmInfo);
            }
        }

        this.generateReport();
    }

    // Generate a summary report
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 INTERNET ARCHIVE AVAILABILITY REPORT');
        console.log('='.repeat(60));

        const totalFilms = this.results.length;
        const foundOnIA = this.results.filter(r => r.foundOnIA).length;
        const notFound = totalFilms - foundOnIA;

        console.log(`Total films checked: ${totalFilms}`);
        console.log(`Found on Internet Archive: ${foundOnIA}`);
        console.log(`Not found: ${notFound}`);
        console.log(`Success rate: ${((foundOnIA / totalFilms) * 100).toFixed(1)}%`);

        // Films found on IA
        if (foundOnIA > 0) {
            console.log('\n✅ FILMS FOUND ON INTERNET ARCHIVE:');
            this.results
                .filter(r => r.foundOnIA)
                .forEach((result, index) => {
                    const match = result.bestMatch;
                    console.log(`${index + 1}. "${result.title}" (${result.year})`);
                    console.log(`   → IA: "${match.title}" (${match.year})`);
                    console.log(`   → URL: ${match.watchUrl}`);
                });
        }

        // Films not found
        if (notFound > 0) {
            console.log('\n❌ FILMS NOT FOUND:');
            this.results
                .filter(r => !r.foundOnIA)
                .forEach((result, index) => {
                    console.log(`${index + 1}. "${result.title}" (${result.year})`);
                });
        }

        // Save detailed results to JSON file
        const reportPath = 'ia-availability-report.json';
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    }
}

// Test function - process just one film
async function testSingleFilm() {
    console.log('🧪 Testing with a single film...\n');
    
    const checker = new SimpleIAChecker();
    
    // Try to find mrs-wiggs-1919.md (which we know has good metadata)
    const testFile = path.join(process.cwd(), 'content', 'films', 'mrs-wiggs-1919.md');
    
    if (!fs.existsSync(testFile)) {
        console.log('Test file not found. Let\'s see what files we have:');
        const filmsDir = path.join(process.cwd(), 'content', 'films');
        if (fs.existsSync(filmsDir)) {
            const files = fs.readdirSync(filmsDir).filter(f => f.endsWith('.md'));
            console.log('Available films:', files.slice(0, 5)); // Show first 5
            if (files.length > 0) {
                const firstFile = path.join(filmsDir, files[0]);
                console.log(`\nUsing ${files[0]} for test...`);
                const filmInfo = checker.parseFilmFile(firstFile);
                if (filmInfo) {
                    await checker.processFilm(filmInfo);
                    checker.generateReport();
                }
            }
        }
        return;
    }
    
    const filmInfo = checker.parseFilmFile(testFile);
    if (filmInfo) {
        await checker.processFilm(filmInfo);
        checker.generateReport();
    }
}

// Main function
async function main() {
    console.log('🎬 Hollywood Regionalism - Internet Archive Checker');
    
    // Check command line arguments
    const args = process.argv.slice(2);
    if (args.includes('--test')) {
        await testSingleFilm();
    } else {
        console.log('Starting full availability check...\n');
        const checker = new SimpleIAChecker();
        await checker.processAllFilms();
    }
    
    console.log('\n✨ Check complete!');
}

// Only run if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}

module.exports = SimpleIAChecker;
