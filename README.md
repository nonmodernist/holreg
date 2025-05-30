# Hollywood Regionalism

**A Digital Archive of Film Adaptations from American Women's Regional Literature, 1910-1961**

From 1910 to 1961, Hollywood made more than 100 films inspired by the novels and short stories of American women regionalists—illuminating the landscapes, cultures, and social debates that shaped a nation. This project explores the US film industry's remarkable half-century fascination with American women regionalists both famous and forgotten.

## About the Project

While academic tradition limits regionalism to a brief literary movement (1880s-1910), Hollywood reveals a different story. For over fifty years, filmmakers transformed regional works into vivid screen adaptations, bringing their stories to national audiences and demonstrating how regionalist storytelling evolved across media—from magazine pages to movie screens.

### Key Statistics
- **40+ Authors** documented
- **121 Film Adaptations** cataloged  
- **51 Years** of adaptation history (1910-1961)
- Spans from early silent era through the end of the classical Hollywood studio system

### Featured Authors
- Gene Stratton-Porter (22 films)
- Fannie Hurst (10 films)
- Alice Hegan Rice (9 films)
- Edna Ferber (8 films)
- Harriet Beecher Stowe (8 films)

## Technical Implementation

This site is built with [Zola](https://www.getzola.org/), a fast static site generator written in Rust. The project uses structured metadata to organize and present film adaptation data systematically.

### Project Structure
```
├── content/
│   ├── films/                 # Individual film entries
│   ├── author-profiles/       # Author biographical pages
│   └── regions/              # Regional literature contexts
├── templates/                # Zola templates
├── data/
│   └── bibliography.toml     # Structured citation data
└── static/                   # Images and assets
```

### Data Organization

Films are organized using comprehensive taxonomies:
- **Authors**: Source literature writers
- **Regions**: Geographic settings (Limberlost Indiana, Appalachian Kentucky, etc.)
- **Studios**: Production companies
- **Eras**: Historical periods (early silent, classical Hollywood, etc.)
- **Survival**: Film preservation status (extant, lost, unknown)
- **Access**: Current availability (available, restricted, unavailable)

Each film entry includes structured metadata for:
- Production details (director, studio, year)
- Source material information
- Regional settings and filming locations
- Survival and availability status
- Significance ratings (essential films, hidden gems)

## Research Methodology

### Source Hierarchy
The project follows a rigorous research methodology with clear source prioritization:

1. **AFI Catalog of Feature Films** (primary authority for production facts)
2. **Contemporary trade publications** (Variety, Motion Picture World, Exhibitors Herald)
3. **Academic sources** (peer-reviewed scholarship)
4. **Secondary sources** (Wikipedia, IMDb for verification only)

### Citation Standards
- All sources documented in `data/bibliography.toml`
- Chicago citation style for both print and online sources
- Viewable source quotes with proper attribution
- Conflict resolution documented when sources disagree

### Content Verification
Each film entry undergoes multi-source verification:
- Cross-referencing production details across multiple sources
- Documenting survival status from film archives
- Identifying availability through institutional collections
- Resolving factual conflicts with transparent methodology

## Current Status

**In Active Development** - The site contains substantial research on major adaptations and is being expanded with additional films and author profiles. While not yet publicly launched, the project serves as a working research database for the Hollywood Regionalism archive.

## Future Development

- Complete coverage of all identified regionalist adaptations (1910-1961)
- Enhanced geographical mapping of filming locations vs. source settings
- Integration with film archive databases for viewing access
- Expanded analysis of adaptation patterns across studios and eras

## For Researchers

This project aims to provide:
- **Comprehensive filmography** of regionalist adaptations with verified metadata
- **Survival status** and **access information** for researchers seeking viewing copies
- **Source documentation** linking films to original literary works
- **Regional analysis** of how Hollywood interpreted American places and cultures
- **Industry context** showing adaptation patterns across studios and decades

The structured data and systematic approach make this a reliable starting point for scholars working on American regionalism, early Hollywood, literary adaptation, or film preservation.

## License

Content is licensed under **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License**.

You are free to share this work under the following terms:
- **Attribution** — You must give appropriate credit and indicate if changes were made
- **NonCommercial** — You may not use the material for commercial purposes  
- **NoDerivatives** — You may not distribute modified versions of the material
