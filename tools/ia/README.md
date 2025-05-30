# Internet Archive Tools

Tools for discovering and integrating Internet Archive film availability into the Hollywood Regionalism project.

## Overview

These tools help automate the process of:
1. **Discovering** which films from the collection are available on Internet Archive
2. **Scoring matches** to determine confidence levels
3. **Flagging ambiguous matches** for manual review
4. **Updating** the film markdown files with availability metadata
5. **Identifying** notable films as "hidden gems" for users

## Tools

### `check-ia-availability.js`
Searches Internet Archive for films in the collection using intelligent matching and scoring.

**What it does:**
- Reads all film markdown files from `content/films/`
- Extracts film metadata including director and studio (not just source author)
- Searches Internet Archive API using multiple strategies
- **Scores each match** on a 0-100 scale based on multiple factors
- **Flags low-confidence matches** for manual review
- Generates detailed JSON report with matches, scores, and alternatives
- Creates reports in the correct location: `reports/ia-reports/`

**Search Strategy:**
The tool tries multiple search approaches in order:
1. Title + Year (most specific)
2. Title + Director
3. Title + Studio
4. Title only (broadest)

**Scoring System (0-100 points):**
- **Title Match (0-40 points)**
  - Exact match: 40 points
  - Partial match: 0-25 points based on similarity
- **Year Match (0-30 points)**
  - Exact year: 30 points
  - 1 year off: 20 points
  - 2 years off: 10 points
- **Creator Match (0-30 points)**
  - Director found: 20 points
  - Studio found: 15 points
- **Description Bonus (0-10 points)**
  - Original story mentioned: 5 points
  - Story author mentioned: 5 points

**Manual Review Flags:**
Films are flagged for review when:
- Single match with score < 50
- Best match has score < 70
- Top two matches are within 15 points

**Usage:**
```bash
# Check all films
node tools/ia/check-ia-availability.js

# Test with a single film first
node tools/ia/check-ia-availability.js --test
```

**Output:**
- Console report showing:
  - High confidence matches
  - Matches needing manual review with detailed breakdowns
  - Alternative matches for ambiguous cases
  - Not found films
- `reports/ia-reports/ia-availability-report.json` with full details

### `update-ia-metadata.js`
Takes the availability report and updates the film markdown files with Internet Archive metadata.

**What it does:**
- Reads the JSON report from `check-ia-availability.js`
- Updates film frontmatter with IA metadata (identifier, URLs, etc.)
- Automatically flags appropriate films as "hidden gems"
- Skips files that already have IA metadata
- Considers match confidence scores when updating

**Usage:**
```bash
# Preview what would be updated (safe to run)
node tools/ia/update-ia-metadata.js --dry-run

# Actually update the files
node tools/ia/update-ia-metadata.js
```

## Workflow

### Initial Setup
```bash
# 1. Run availability check
node tools/ia/check-ia-availability.js

# 2. Review the console output for flagged matches
# Look for the "⚠️ NEEDS MANUAL REVIEW" section

# 3. Check the detailed JSON report
cat reports/ia-reports/ia-availability-report.json

# 4. For flagged matches, verify the best match is correct
# You can manually edit the JSON report if needed

# 5. Preview updates (safe)
node tools/ia/update-ia-metadata.js --dry-run

# 6. Apply updates
node tools/ia/update-ia-metadata.js
```

### Handling Manual Reviews
When films are flagged for review:

1. **Check the console output** for the review reason and alternatives
2. **Visit the suggested URLs** to verify the match
3. **If the match is wrong**, edit the JSON report:
   ```json
   {
     "title": "Film Title",
     "foundOnIA": true,
     "bestMatch": {
       "identifier": "correct_identifier",
       "title": "Correct Title on IA",
       "watchUrl": "https://archive.org/details/correct_identifier"
       // ... update with correct match
     }
   }
   ```
4. **Re-run the update tool** to process your corrections

### Regular Updates
```bash
# Re-check availability (maybe monthly?)
node tools/ia/check-ia-availability.js

# Review any new manual flags
# Update any new finds
node tools/ia/update-ia-metadata.js
```

## What Gets Added to Film Files

When a film is found on IA, this metadata block gets added to the frontmatter:

```toml
[extra.internet_archive]
available = true
identifier = "film_identifier_on_ia"
title_on_ia = "Title as Listed on IA"
watch_url = "https://archive.org/details/film_identifier"
embed_url = "https://archive.org/embed/film_identifier"
last_checked = "2025-05-30"
```

### Hidden Gem Detection
Films are automatically flagged as "hidden gems" if they're:
- Early silent films (pre-1920)
- Pre-Code sound films (1929-1934)
- Lesser-known Fannie Hurst adaptations
- Films associated with Mary Pickford (actress/producer) or Frances Marion (screenwriter/director)
- Available and not already marked as "essential"

## Interpreting Confidence Scores

- **90-100**: Very High Confidence - Almost certainly the correct match
- **70-89**: High Confidence - Very likely correct
- **50-69**: Medium Confidence - Probably correct but worth verifying
- **30-49**: Low Confidence - Needs manual verification
- **0-29**: Very Low Confidence - Unlikely to be correct

## Requirements

- **Node.js** (built-in modules only, no external dependencies)
- **Internet connection** for API calls
- **Film files** must have proper frontmatter with:
  - `title` and `year` fields
  - `director` field or `directors` taxonomy
  - `studio` field or `studios` taxonomy

## API Considerations

- **Rate limiting**: 2-second delay between requests to be respectful to Internet Archive
- **Search strategy**: Uses multiple approaches for better matching
- **Error handling**: Continues processing if individual films fail

## Troubleshooting

### "Films directory not found"
Make sure you're running from the project root directory where `content/films/` exists.

### "Could not load report" 
- Check that the file exists at `reports/ia-reports/ia-availability-report.json`
- Run `check-ia-availability.js` first to generate the report

### Poor search results
- Check that your film files have accurate `title`, `year`, `director`, and `studio` fields
- Look at the score breakdown in the console to see why matches scored low
- Some films may be on IA with different titles/metadata
- Use the manual review process for ambiguous matches

### Files not updating
- Use `--dry-run` first to see what would be updated
- Check that frontmatter format is valid TOML
- Files with existing `[extra.internet_archive]` sections are skipped

### Manual additions to reports
If the automated search misses films you know are on IA:
1. Manually add entries to `reports/ia-reports/ia-availability-report.json`
2. Use the same JSON structure as automatically found films
3. Set `needsManualReview: false` if you're confident
4. Re-run `update-ia-metadata.js` to process your manual additions

## Integration with Zola

The metadata added by these tools works with the existing Zola templates:

- **Film sidebar**: Shows "Watch Now" button via `internet_archive.html` macro
- **Film cards**: Can display availability status
- **Filtering**: Could add IA availability as a taxonomy if desired

## File Structure
```
tools/ia/
├── check-ia-availability.js     # Discovery tool with scoring
├── update-ia-metadata.js        # Metadata integration tool
└── README.md                    # This file

reports/ia-reports/
└── ia-availability-report.json  # Generated report with scores
```

## Understanding the JSON Report

The report includes detailed information for each film:

```json
{
  "title": "Giant",
  "year": 1956,
  "director": "George Stevens",
  "studio": "Warner Bros",
  "foundOnIA": true,
  "needsManualReview": false,
  "bestMatch": {
    "identifier": "giant_1956",
    "title": "Giant",
    "score": 100,
    "scoreBreakdown": {
      "title": "Exact match (40)",
      "year": "Exact match (30)",
      "creator": "Director: George Stevens, Studio: Warner Bros (30)",
      "description": "Source material mentioned (5)"
    }
  },
  "alternativeMatches": []
}
```

## Future Enhancements

- [ ] Support for re-checking specific films only
- [ ] Integration with other archives beyond Internet Archive
- [ ] Batch operations for updating significance ratings
- [ ] CSV export of availability data for analysis
- [ ] Machine learning for better title matching
- [ ] Support for identifying alternate titles/releases