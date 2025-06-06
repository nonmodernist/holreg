# Film Research Template & Workflow

## Research Checklist for Each Film

### Phase 1: AFI Catalog (Primary Source)
- [ ] **Basic Production Info**
  - Title (exact as listed)
  - Year of release
  - Director(s)
  - Studio/Production company
  - Distributor (if different)
  - Runtime/Duration (for survival/completeness context)
  - Format (Silent/Sound, B&W/Color, etc.)

- [ ] **Adaptation-Focused Cast & Crew**
  - **Screenwriter/Scenario writer** (key for adaptation analysis)
  - **Principal cast** (especially recurring stars like Mary Pickford)
  - **Producer** (especially author-producers like Gene Stratton-Porter)
  - **Notable crew** (Frances Marion, other recurring figures in regionalist adaptations)

- [ ] **Source Material Info** (CRITICAL)
  - Original story/novel title (exact)
  - Author name (full name as credited)
  - Publication year of source
  - Publication details (magazine vs. novel, etc.)
  - Any adaptation notes from AFI

- [ ] **Regionalism-Relevant Production Notes**
  - **Filming locations** (especially when substituting regions)
  - **Setting** (geographic region depicted)
  - Any notes about authentic vs. substitute locations
  - Special production circumstances related to regional authenticity

- [ ] **Survival Status**
  - Current location of print(s)
  - Completeness status
  - Restoration notes
  - Access status (public vs. restricted)

### Phase 2: Cross-Reference & Verify
- [ ] **Academic Sources** (JSTOR, Project MUSE, etc.)
  - Search for: "[Film Title] [Year]"
  - Search for: "[Author Name] film adaptation"
  - Search for: "[Director Name] regionalism" or similar

- [ ] **Contemporary Trade Publications**
  - Variety reviews/production notes
  - Motion Picture World
  - Exhibitors Herald
  - Other trade magazines from the era

- [ ] **Secondary Sources**
  - Wikipedia (for basic verification)
  - IMDb (final verification only)

### Phase 3: Documentation
- [ ] **Add to bibliography.toml**
  - AFI Catalog entry
  - All academic sources found
  - Trade publication sources
  - Any archival sources

- [ ] **Flag Conflicts** (use conflict tracking system below)

---

## Conflict Resolution System

### When Sources Disagree:
1. **Create a conflict note**: `[CONFLICT: AFI says X, Source Y says Z]`
2. **Research hierarchy for resolution**:
   - AFI Catalog (most authoritative for basic facts)
   - Contemporary trade publications (for production context)
   - Academic sources (for analysis and interpretation)
   - Wikipedia/IMDb (least authoritative)

3. **Document resolution**: 
   - Note which source you chose and why
   - Keep conflicting information for potential footnotes

### Common Conflict Areas to Watch For:
- **Release dates** (production vs. release vs. copyright)
- **Runtime** (original vs. current surviving length)
- **Cast spelling/credits**
- **Production company vs. distributor**
- **Filming locations** (studio backlot vs. location)

---

## Content Organization Template

### Standard Film Entry Structure:

+++
title = "[Exact Film Title]"
weight = [Year] # For chronological sorting

[taxonomies]
authors = ["[Author Name]"]
regions = ["[Specific Region]", "[Broader Region if applicable]"]
studios = ["[Studio Name]"]
eras = ["[Era: early silent/late silent/pre-code/classical hollywood/post-classical hollywood]"]
genres = ["[Primary Genre]", "[Secondary Genre if applicable]"]
survival = ["extant/lost/unknown"]
access = ["available/restricted/unavailable"] # Only if survival = "extant"
directors = ["[Director Name]"]

[extra]
# Content flags
show_citation = true
author_byline = "[Name of webpage author]"


# Core film metadata for sidebar
significance = "essential"  # or "hidden_gem" or omit for standard films
significance_note = "[Explain why the film is essential or a hidden gem]"
year = [Year]
original_story = "[Exact Source Title]"
story_type = "[novel/short story/other]"
story_year = [Publication Year]
story_author = "[Author Name]"
director = "[Director Name]"
screenwriter = "[Screenwriter Name]" # if important for adaptation analysis
studio = "[Studio Name]"
setting = "[Geographic Setting as Depicted]"
filming_locations = ["[Actual Filming Location]"] # Array format for multiple locations
format = "[Silent/Sound], [B&W/Color]"
duration = "[Runtime if known]"

# Film status details (using new metadata structure)
[extra.film_status]
survival = "extant/lost/unknown"
completeness = "complete/incomplete" # Only if extant
access = "available/restricted/unavailable"
restoration = "restored/unrestored"
quality = "excellent/good/fair/poor"
restoration_notes = "[notes about most recent restoration]"
availability_type = "internet_archive/dvd/streaming/archive_only" # If available
availability_notes = "[Specific availability details]"

# Film image (if available)
[extra.film_image]
url = "/images/[filename]"
alt = "[Alt text description]"
caption = "[Caption with source attribution]"
+++

[Clean, focused plot summary emphasizing regional/cultural elements]

## Regional Focus

Set in {{region}} during {{historical period}}. 

[Analysis of how the film represents the source's regional setting and themes. Discussion of authenticity vs. adaptation choices. Connection to broader patterns in Hollywood regionalism.]

## Production Strategy / Hollywood's Approach [Flexible Production Section]

### Filming Locations
[Discussion of where filmed vs. where set. Analysis of location choices and their impact on regional authenticity.]

### Production and Adaptation
[How this film fits into the larger landscape of regionalist adaptations. Studio context, recurring personnel (Mary Pickford, Frances Marion, etc.), connection to other adaptations of same author or region.]

[How the film transforms the source material. Key changes made for cinematic adaptation. Screenwriter's approach to the source. - Include as subsection under Production Context]

## [Patterns or connections to other films] # Optional section, to be titled while writing

[Include if not covered in the above sections]

## Notes
[Numbered scholarly endnotes with citation shortcodes, following this format:]

1. **[Topic/theme]:** [Detailed explanation or context]. {{ cite(id="source_id") }}

2. **[Another topic]:** [More detail with source attribution]. {{ cite(id="another_source") }}


### Section Guidelines:

**Plot Summary**: Keep factual and brief - focus on elements relevant to regionalism
**Regional Focus**: Key analytical section - connect to larger argument about regionalism
**Production Strategy**: 
- "Filming Locations" (when location substitution is key to the argument)
- "Production and Adaptation" (when studio practices/author control is central and/or when technical/aesthetic innovations serve the analysis)  
**Notes**: Numbered format with bolded topic headers and citation shortcodes

### Image Requirements:
- Every film entry should attempt to include an image in frontmatter
- Prioritize: publicity stills > lobby cards > contemporary promotional materials > archival photos
- Always include detailed alt text and source attribution in caption

---

## High-Profile Films to Start With:

### Tier 1 (Most Likely to Have Rich Sources):
- Gone with the Wind (1939)
- Giant (1956) 
- Any Gene Stratton-Porter films with surviving prints

### Tier 2 (Good Source Availability):
- Major studio productions (Paramount, MGM, Warner Bros.)
- Films with notable directors
- Adaptations of very famous novels

### Research Priority Order:
1. Start with Tier 1 films to develop your process
2. Move to films you already have partial research on
3. Fill in remaining entries systematically

---

## Time Management Suggestions:

- **Per film budget**: 2-3 hours for thorough research
- **Batch similar tasks**: Do all AFI searches first, then all academic database searches
- **Document as you go**: Don't defer citation entry to later
- **Quality control**: Review every 5-10 entries for consistency
