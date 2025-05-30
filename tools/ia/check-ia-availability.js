// check-ia-availability.js
// Internet Archive availability checker with scoring system for Hollywood Regionalism project

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
        
        // Extract key fields
        const title = this.extractField(frontmatter, 'title');
        const year = this.extractField(frontmatter, 'year');
        const director = this.extractDirector(frontmatter);
        const studio = this.extractStudio(frontmatter);
        const originalStory = this.extractField(frontmatter, 'original_story');
        const storyAuthor = this.extractField(frontmatter, 'story_author');
        
        if (!title) {
            console.log(`⚠️  No title found in ${path.basename(filePath)}`);
            return null;
        }

        return {
            filePath,
            fileName: path.basename(filePath),
            title: title.replace(/"/g, ''), // Remove quotes
            year: year ? parseInt(year) : null,
            director,
            studio,
            originalStory: originalStory ? originalStory.replace(/"/g, '') : null,
            storyAuthor: storyAuthor ? storyAuthor.replace(/"/g, '') : null
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

    // Extract director from either the directors taxonomy or director field
    extractDirector(content) {
        // First try the directors taxonomy array
        const taxonomyMatch = content.match(/^directors\s*=\s*\[([^\]]*)\]/m);
        if (taxonomyMatch) {
            const directorsStr = taxonomyMatch[1];
            const firstDirector = directorsStr.split(',')[0];
            return firstDirector ? firstDirector.trim().replace(/"/g, '') : null;
        }
        
        // Fall back to the director field in [extra]
        return this.extractField(content, 'director');
    }

    // Extract studio from either the studios taxonomy or studio field
    extractStudio(content) {
        // First try the studios taxonomy array
        const taxonomyMatch = content.match(/^studios\s*=\s*\[([^\]]*)\]/m);
        if (taxonomyMatch) {
            const studiosStr = taxonomyMatch[1];
            const firstStudio = studiosStr.split(',')[0];
            return firstStudio ? firstStudio.trim().replace(/"/g, '') : null;
        }
        
        // Fall back to the studio field in [extra]
        return this.extractField(content, 'studio');
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
        
        // Try multiple search strategies
        const searchStrategies = [];
        
        // Strategy 1: Title + Year (most specific)
        if (filmInfo.year) {
            searchStrategies.push({
                name: 'Title + Year',
                query: `title:(${filmInfo.title}) AND year:(${filmInfo.year}) AND mediatype:movies`
            });
        }
        
        // Strategy 2: Title + Director
        if (filmInfo.director) {
            searchStrategies.push({
                name: 'Title + Director',
                query: `title:(${filmInfo.title}) AND creator:(${filmInfo.director}) AND mediatype:movies`
            });
        }
        
        // Strategy 3: Title + Studio
        if (filmInfo.studio) {
            searchStrategies.push({
                name: 'Title + Studio',
                query: `title:(${filmInfo.title}) AND creator:(${filmInfo.studio}) AND mediatype:movies`
            });
        }
        
        // Strategy 4: Just title (broadest)
        searchStrategies.push({
            name: 'Title Only',
            query: `title:(${filmInfo.title}) AND mediatype:movies`
        });

        // Try each strategy until we find results
        for (const strategy of searchStrategies) {
            console.log(`   Trying strategy: ${strategy.name}`);
            
            try {
                const results = await this.performSearch(strategy.query, filmInfo);
                if (results.length > 0) {
                    console.log(`   ✅ Found ${results.length} results using ${strategy.name}`);
                    return results;
                }
            } catch (error) {
                console.error(`   ❌ Error with ${strategy.name}:`, error.message);
            }
        }
        
        console.log(`   ❌ No results found with any strategy`);
        return [];
    }

    // Perform the actual search
    async performSearch(query, filmInfo) {
        const baseUrl = 'https://archive.org/advancedsearch.php';
        const params = new URLSearchParams({
            q: query,
            fl: 'identifier,title,creator,year,description',
            rows: '10',
            output: 'json'
        });
        
        const searchUrl = `${baseUrl}?${params.toString()}`;
        
        const data = await this.makeRequest(searchUrl);
        const docs = data.response?.docs || [];
        
        // Filter results to better match our film
        const filteredDocs = this.filterResults(docs, filmInfo);
        
        return filteredDocs.map(doc => ({
            identifier: doc.identifier,
            title: doc.title,
            creator: doc.creator,
            year: doc.year,
            description: doc.description,
            watchUrl: `https://archive.org/details/${doc.identifier}`,
            embedUrl: `https://archive.org/embed/${doc.identifier}`,
            score: doc.score,
            scoreBreakdown: doc.scoreBreakdown
        }));
    }

    // Score and rank search results
    scoreResult(doc, filmInfo) {
        let score = 0;
        const scoreBreakdown = {};
        
        // Title matching (0-40 points)
        const docTitle = (doc.title || '').toLowerCase().replace(/[^\w\s]/g, '');
        const filmTitle = filmInfo.title.toLowerCase().replace(/[^\w\s]/g, '');
        
        if (docTitle === filmTitle) {
            score += 40;
            scoreBreakdown.title = "Exact match (40)";
        } else if (docTitle.includes(filmTitle) || filmTitle.includes(docTitle)) {
            // Calculate partial match score based on length similarity
            const lengthRatio = Math.min(docTitle.length, filmTitle.length) / 
                               Math.max(docTitle.length, filmTitle.length);
            const partialScore = Math.round(25 * lengthRatio);
            score += partialScore;
            scoreBreakdown.title = `Partial match (${partialScore})`;
        } else {
            scoreBreakdown.title = "No match (0)";
        }
        
        // Year matching (0-30 points)
        if (filmInfo.year && doc.year) {
            const docYear = parseInt(doc.year);
            const filmYear = parseInt(filmInfo.year);
            const yearDiff = Math.abs(docYear - filmYear);
            
            if (yearDiff === 0) {
                score += 30;
                scoreBreakdown.year = "Exact match (30)";
            } else if (yearDiff === 1) {
                score += 20;
                scoreBreakdown.year = "1 year off (20)";
            } else if (yearDiff === 2) {
                score += 10;
                scoreBreakdown.year = "2 years off (10)";
            } else {
                scoreBreakdown.year = `${yearDiff} years off (0)`;
            }
        } else {
            scoreBreakdown.year = "No year data (0)";
        }
        
        // Creator matching - Director or Studio (0-30 points)
        const creators = (doc.creator || '').toLowerCase();
        let creatorScore = 0;
        const creatorMatches = [];
        
        if (filmInfo.director && creators.includes(filmInfo.director.toLowerCase())) {
            creatorScore += 20;
            creatorMatches.push(`Director: ${filmInfo.director}`);
        }
        
        if (filmInfo.studio && creators.includes(filmInfo.studio.toLowerCase())) {
            creatorScore += 15;
            creatorMatches.push(`Studio: ${filmInfo.studio}`);
        }
        
        score += creatorScore;
        scoreBreakdown.creator = creatorMatches.length > 0 
            ? `${creatorMatches.join(', ')} (${creatorScore})`
            : "No creator matches (0)";
        
        // Description bonus (0-10 points)
        const description = (doc.description || '').toLowerCase();
        let descriptionScore = 0;
        
        if (filmInfo.originalStory && description.includes(filmInfo.originalStory.toLowerCase())) {
            descriptionScore += 5;
        }
        if (filmInfo.storyAuthor && description.includes(filmInfo.storyAuthor.toLowerCase())) {
            descriptionScore += 5;
        }
        
        score += descriptionScore;
        if (descriptionScore > 0) {
            scoreBreakdown.description = `Source material mentioned (${descriptionScore})`;
        }
        
        return { score, scoreBreakdown, maxScore: 100 };
    }
    
    // Filter and rank search results
    filterResults(docs, filmInfo) {
        // First, do basic filtering
        const filtered = docs.filter(doc => {
            // Must have at least partial title match
            const docTitle = (doc.title || '').toLowerCase();
            const filmTitle = filmInfo.title.toLowerCase();
            
            if (!docTitle.includes(filmTitle) && !filmTitle.includes(docTitle)) {
                return false;
            }
            
            // If we have a year, allow up to 2 years variance
            if (filmInfo.year && doc.year) {
                const yearDiff = Math.abs(parseInt(doc.year) - parseInt(filmInfo.year));
                if (yearDiff > 2) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Score and sort the results
        const scored = filtered.map(doc => ({
            ...doc,
            ...this.scoreResult(doc, filmInfo)
        }));
        
        // Sort by score (highest first)
        return scored.sort((a, b) => b.score - a.score);
    }

    // Add a delay between requests
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Process a single film
    async processFilm(filmInfo) {
        const iaResults = await this.searchIA(filmInfo);
        
        // Determine if manual review is needed
        let needsManualReview = false;
        let reviewReason = '';
        
        if (iaResults.length === 0) {
            needsManualReview = false; // No results, nothing to review
        } else if (iaResults.length === 1) {
            // Single result - flag for review if low confidence
            if (iaResults[0].score < 50) {
                needsManualReview = true;
                reviewReason = `Low confidence match (score: ${iaResults[0].score}/100)`;
            }
        } else {
            // Multiple results - check score differences
            const topScore = iaResults[0].score;
            const secondScore = iaResults[1].score;
            
            if (topScore < 70) {
                needsManualReview = true;
                reviewReason = `Best match has low confidence (score: ${topScore}/100)`;
            } else if (topScore - secondScore < 15) {
                needsManualReview = true;
                reviewReason = `Multiple similar matches (scores: ${topScore} vs ${secondScore})`;
            }
        }
        
        const result = {
            ...filmInfo,
            foundOnIA: iaResults.length > 0,
            iaResults,
            bestMatch: iaResults[0] || null,
            needsManualReview,
            reviewReason,
            alternativeMatches: iaResults.slice(1, 3) // Top 3 alternatives
        };
        
        this.results.push(result);
        
        // Add delay to be respectful to IA's servers
        await this.delay(this.rateLimitDelay);
        
        return result;
    }

    // Ensure reports directory exists
    ensureReportsDirectory() {
        const reportsDir = path.join(process.cwd(), 'reports');
        const iaReportsDir = path.join(reportsDir, 'ia-reports');
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
            console.log(`📁 Created reports directory`);
        }
        
        if (!fs.existsSync(iaReportsDir)) {
            fs.mkdirSync(iaReportsDir);
            console.log(`📁 Created ia-reports directory`);
        }
        
        return iaReportsDir;
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
            .filter(file => file.endsWith('.md') && file !== '_index.md')
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

    // Get confidence level description
    getConfidenceLevel(score) {
        if (score >= 90) return "Very High Confidence";
        if (score >= 70) return "High Confidence";
        if (score >= 50) return "Medium Confidence";
        if (score >= 30) return "Low Confidence";
        return "Very Low Confidence";
    }
    
    // Generate a summary report
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 INTERNET ARCHIVE AVAILABILITY REPORT');
        console.log('='.repeat(60));

        const totalFilms = this.results.length;
        const foundOnIA = this.results.filter(r => r.foundOnIA).length;
        const needsReview = this.results.filter(r => r.needsManualReview).length;
        const notFound = totalFilms - foundOnIA;

        console.log(`Total films checked: ${totalFilms}`);
        console.log(`Found on Internet Archive: ${foundOnIA}`);
        console.log(`  - High confidence: ${foundOnIA - needsReview}`);
        console.log(`  - Needs manual review: ${needsReview}`);
        console.log(`Not found: ${notFound}`);
        console.log(`Success rate: ${((foundOnIA / totalFilms) * 100).toFixed(1)}%`);

        // Films found on IA
        if (foundOnIA > 0) {
            console.log('\n✅ FILMS FOUND ON INTERNET ARCHIVE:');
            
            // Separate high-confidence and needs-review
            const highConfidence = this.results.filter(r => r.foundOnIA && !r.needsManualReview);
            const needsReview = this.results.filter(r => r.foundOnIA && r.needsManualReview);
            
            if (highConfidence.length > 0) {
                console.log('\n🎯 HIGH CONFIDENCE MATCHES:');
                highConfidence.forEach((result, index) => {
                    const match = result.bestMatch;
                    console.log(`${index + 1}. "${result.title}" (${result.year})`);
                    if (result.director) {
                        console.log(`   Director: ${result.director}`);
                    }
                    if (result.studio) {
                        console.log(`   Studio: ${result.studio}`);
                    }
                    console.log(`   → IA: "${match.title}" (${match.year})`);
                    console.log(`   → Score: ${match.score}/100 - ${this.getConfidenceLevel(match.score)}`);
                    console.log(`   → URL: ${match.watchUrl}`);
                });
            }
            
            if (needsReview.length > 0) {
                console.log('\n⚠️  NEEDS MANUAL REVIEW:');
                needsReview.forEach((result, index) => {
                    const match = result.bestMatch;
                    console.log(`${index + 1}. "${result.title}" (${result.year})`);
                    console.log(`   🚩 ${result.reviewReason}`);
                    if (result.director) {
                        console.log(`   Director: ${result.director}`);
                    }
                    if (result.studio) {
                        console.log(`   Studio: ${result.studio}`);
                    }
                    console.log(`   → Best match: "${match.title}" (${match.year})`);
                    console.log(`   → Score: ${match.score}/100`);
                    console.log(`   → Breakdown: ${Object.entries(match.scoreBreakdown).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
                    console.log(`   → URL: ${match.watchUrl}`);
                    
                    if (result.alternativeMatches.length > 0) {
                        console.log('   → Alternatives:');
                        result.alternativeMatches.forEach((alt, i) => {
                            console.log(`     ${i + 1}. "${alt.title}" (${alt.year}) - Score: ${alt.score}/100`);
                        });
                    }
                });
            }
        }

        // Films not found
        if (notFound > 0) {
            console.log('\n❌ FILMS NOT FOUND:');
            this.results
                .filter(r => !r.foundOnIA)
                .forEach((result, index) => {
                    console.log(`${index + 1}. "${result.title}" (${result.year})`);
                    if (result.director) {
                        console.log(`   Director: ${result.director}`);
                    }
                    if (result.studio) {
                        console.log(`   Studio: ${result.studio}`);
                    }
                });
        }

        // Ensure reports directory exists and save detailed results
        const iaReportsDir = this.ensureReportsDirectory();
        const reportPath = path.join(iaReportsDir, 'ia-availability-report.json');
        
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    }
}

// Test function - process just one film
async function testSingleFilm() {
    console.log('🧪 Testing with a single film...\n');
    
    const checker = new SimpleIAChecker();
    
    // Try to find a-girl-of-the-limberlost-1934.md (which we know has good metadata)
    const testFile = path.join(process.cwd(), 'content', 'films', 'a-girl-of-the-limberlost-1934.md');
    
    if (!fs.existsSync(testFile)) {
        console.log('Test file not found. Let\'s see what files we have:');
        const filmsDir = path.join(process.cwd(), 'content', 'films');
        if (fs.existsSync(filmsDir)) {
            const files = fs.readdirSync(filmsDir)
                .filter(f => f.endsWith('.md') && f !== '_index.md');
            console.log('Available films:', files.slice(0, 5)); // Show first 5
            if (files.length > 0) {
                const firstFile = path.join(filmsDir, files[0]);
                console.log(`\nUsing ${files[0]} for test...`);
                const filmInfo = checker.parseFilmFile(firstFile);
                if (filmInfo) {
                    console.log('\nExtracted metadata:');
                    console.log(`  Title: ${filmInfo.title}`);
                    console.log(`  Year: ${filmInfo.year}`);
                    console.log(`  Director: ${filmInfo.director || 'Not found'}`);
                    console.log(`  Studio: ${filmInfo.studio || 'Not found'}`);
                    await checker.processFilm(filmInfo);
                    checker.generateReport();
                }
            }
        }
        return;
    }
    
    const filmInfo = checker.parseFilmFile(testFile);
    if (filmInfo) {
        console.log('Extracted metadata:');
        console.log(`  Title: ${filmInfo.title}`);
        console.log(`  Year: ${filmInfo.year}`);
        console.log(`  Director: ${filmInfo.director || 'Not found'}`);
        console.log(`  Studio: ${filmInfo.studio || 'Not found'}`);
        await checker.processFilm(filmInfo);
        checker.generateReport();
    }
}

// Main function
async function main() {
    console.log('🎬 Hollywood Regionalism - Internet Archive Checker');
    console.log('Version 2.0 - Now searches by director and studio!\n');
    
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