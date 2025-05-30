// update-ia-metadata.js
// Updates film markdown files with Internet Archive information

const fs = require('fs');
const path = require('path');

class IAMetadataUpdater {
    constructor(reportPath = 'ia-availability-report.json') {
        this.reportPath = reportPath;
        this.results = this.loadReport();
        this.updated = 0;
        this.skipped = 0;
    }

    loadReport() {
        try {
            const data = fs.readFileSync(this.reportPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Could not load report from ${this.reportPath}`);
            console.error('Make sure you ran check-ia-availability.js first!');
            process.exit(1);
        }
    }

    updateFilmFile(filmResult) {
        const filePath = filmResult.filePath;
        console.log(`\n📝 Updating ${path.basename(filePath)}`);
        
        // Read the current file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if already has IA metadata
        if (content.includes('[extra.internet_archive]')) {
            console.log('   ⏭️  Already has IA metadata, skipping');
            this.skipped++;
            return;
        }

        const match = filmResult.bestMatch;
        const today = new Date().toISOString().split('T')[0];

        // Create the IA metadata block
        const iaMetadata = `
[extra.internet_archive]
available = true
identifier = "${match.identifier}"
title_on_ia = "${match.title}"
watch_url = "${match.watchUrl}"
embed_url = "${match.embedUrl}"
last_checked = "${today}"`;

        // Find where to insert it - before the closing +++
        const parts = content.split('+++');
        if (parts.length !== 3) {
            console.log('   ❌ Could not parse frontmatter structure');
            return;
        }

        // Insert the metadata at the end of the frontmatter
        const updatedContent = parts[0] + '+++' + parts[1] + iaMetadata + '\n+++' + parts[2];

        // Write back to file
        fs.writeFileSync(filePath, updatedContent);
        console.log('   ✅ Updated with IA metadata');
        this.updated++;
    }

    updateSignificanceForAvailableFilms() {
        console.log('\n🌟 Checking which IA films should be marked as "hidden gems"...\n');
        
        const filmsToMark = this.results
            .filter(r => r.foundOnIA)
            .map(r => ({
                ...r,
                isEssential: this.isEssentialFilm(r),
                isHiddenGem: this.isHiddenGem(r)
            }));

        filmsToMark.forEach(film => {
            if (film.isEssential) {
                console.log(`⭐ "${film.title}" (${film.year}) - Already essential, no change needed`);
            } else if (film.isHiddenGem) {
                console.log(`💎 "${film.title}" (${film.year}) - Could be marked as hidden gem`);
                this.addSignificanceMetadata(film, 'hidden_gem');
            } else {
                console.log(`📽️ "${film.title}" (${film.year}) - Standard film, IA availability noted`);
            }
        });
    }

    isEssentialFilm(filmResult) {
        const essentialTitles = [
            'gone with the wind',
            'giant',
            'pollyanna', // Mary Pickford films are pretty essential
            'rebecca of sunnybrook farm'
        ];
        
        return essentialTitles.some(title => 
            filmResult.title.toLowerCase().includes(title)
        );
    }

    isHiddenGem(filmResult) {
        // Available, not super famous, from interesting periods
        const year = filmResult.year;
        
        // Early silent films (pre-1920) are often hidden gems
        if (year <= 1920) return true;
        
        // Pre-code sound films
        if (year >= 1929 && year <= 1934) return true;
        
        // Fannie Hurst adaptations that aren't widely known
        if (filmResult.author === 'Fannie Hurst' && 
            !filmResult.title.toLowerCase().includes('imitation of life')) {
            return true;
        }
        
        return false;
    }

    addSignificanceMetadata(filmResult, significance) {
        const filePath = filmResult.filePath;
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if already has significance
        if (content.includes('significance =')) {
            return;
        }

        const significanceNote = this.generateSignificanceNote(filmResult, significance);
        
        const significanceMetadata = `
significance = "${significance}"
significance_note = "${significanceNote}"`;

        // Add after the year field
        content = content.replace(
            /(\nyear = \d+)/,
            `$1${significanceMetadata}`
        );

        fs.writeFileSync(filePath, content);
        console.log(`   ✅ Added ${significance} significance`);
    }

    generateSignificanceNote(filmResult, significance) {
        const title = filmResult.title;
        const year = filmResult.year;
        const author = filmResult.author;

        if (significance === 'hidden_gem') {
            if (year <= 1920) {
                return `Rare surviving silent film from ${year}, available free on Internet Archive.`;
            } else if (year >= 1929 && year <= 1934) {
                return `Pre-Code era adaptation of ${author}'s work, freely viewable on Internet Archive.`;
            } else if (author === 'Fannie Hurst') {
                return `Lesser-known ${author} adaptation, available for free viewing on Internet Archive.`;
            } else {
                return `Overlooked regionalist adaptation, available free on Internet Archive.`;
            }
        }
        
        return '';
    }

    processAllFinds() {
        console.log('🎬 Internet Archive Metadata Updater');
        console.log(`📊 Processing ${this.results.length} films from report...\n`);

        const foundFilms = this.results.filter(r => r.foundOnIA);
        
        if (foundFilms.length === 0) {
            console.log('❌ No films found on Internet Archive to update.');
            return;
        }

        console.log(`✅ Found ${foundFilms.length} films available on IA:`);
        foundFilms.forEach((film, index) => {
            console.log(`   ${index + 1}. "${film.title}" (${film.year})`);
        });

        console.log('\n📝 Updating film files...');
        
        foundFilms.forEach(filmResult => {
            this.updateFilmFile(filmResult);
        });

        // Update significance for available films
        this.updateSignificanceForAvailableFilms();

        console.log('\n📈 Summary:');
        console.log(`   Updated: ${this.updated} files`);
        console.log(`   Skipped: ${this.skipped} files (already had IA metadata)`);
        console.log(`   Total IA films: ${foundFilms.length}`);

        console.log('\n🎯 Next steps:');
        console.log('   1. Review the updated files to make sure they look correct');
        console.log('   2. Update your templates to display IA availability');
        console.log('   3. Build your site to see the new IA integration!');
    }

    // Dry run - show what would be updated without making changes
    dryRun() {
        console.log('🧪 DRY RUN - Showing what would be updated (no files changed)\n');
        
        const foundFilms = this.results.filter(r => r.foundOnIA);
        
        foundFilms.forEach(filmResult => {
            console.log(`\n📄 ${path.basename(filmResult.filePath)}`);
            console.log(`   Title: "${filmResult.title}" (${filmResult.year})`);
            console.log(`   IA ID: ${filmResult.bestMatch.identifier}`);
            console.log(`   Watch: ${filmResult.bestMatch.watchUrl}`);
            
            const content = fs.readFileSync(filmResult.filePath, 'utf8');
            if (content.includes('[extra.internet_archive]')) {
                console.log('   Status: ⏭️  Already has IA metadata');
            } else {
                console.log('   Status: ✨ Would add IA metadata');
            }
        });
    }
}

// Main function
function main() {
    const args = process.argv.slice(2);
    const updater = new IAMetadataUpdater();
    
    if (args.includes('--dry-run')) {
        updater.dryRun();
    } else {
        updater.processAllFinds();
    }
}

if (require.main === module) {
    main();
}

module.exports = IAMetadataUpdater;