#!/usr/bin/env python3
"""
Author Profile Generator for Hollywood Regionalism Project
Generates markdown files with frontmatter for each author from CSV data
"""

import pandas as pd
import os
import re
from collections import defaultdict, Counter
from datetime import datetime

def slugify(text):
    """Convert text to URL-friendly slug"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def extract_regions_from_setting(setting):
    """Extract regions from setting descriptions"""
    if pd.isna(setting) or not setting:
        return []
    
    regions = []
    setting = str(setting).lower()
    
    # Common region mappings based on your project
    region_mappings = {
        'indiana': 'Rural Indiana',
        'limberlost': 'Limberlost Indiana',
        'midwest': 'Rural Midwest', 
        'california': 'Southern California',
        'south': 'American South',
        'new england': 'New England',
        'west': 'American West',
        'texas': 'Texas',
        'appalachian': 'Appalachian Mountains',
        'prairie': 'Great Plains'
    }
    
    for keyword, region in region_mappings.items():
        if keyword in setting:
            regions.append(region)
    
    return list(set(regions)) if regions else ['Rural America']

def determine_era(year):
    """Determine film era based on year"""
    if pd.isna(year) or year == 0:
        return 'unknown'
    
    year = int(year)
    if year <= 1927:
        return 'early silent' if year <= 1919 else 'late silent'
    elif year <= 1934:
        return 'pre-code'
    elif year <= 1960:
        return 'classical Hollywood'
    else:
        return 'studio system decline'

def extract_dates_from_author_name(author_name):
    """Try to extract birth/death dates if they're in the author name"""
    # Pattern like "Author Name (1863-1924)"
    date_pattern = r'\((\d{4})-(\d{4})\)'
    match = re.search(date_pattern, author_name)
    if match:
        birth_year, death_year = match.groups()
        clean_name = re.sub(date_pattern, '', author_name).strip()
        return clean_name, birth_year, death_year
    return author_name, None, None

def generate_author_profile(author_name, author_films, output_dir):
    """Generate a single author profile markdown file"""
    
    # Clean author name and extract dates if present
    clean_name, birth_year, death_year = extract_dates_from_author_name(author_name)
    slug = slugify(clean_name)
    
    # Aggregate data from all films by this author
    regions = set()
    studios = set()
    directors = set()
    eras = set()
    genres = set()
    years = []
    
    extant_films = []
    lost_films = []
    
    for film in author_films:
        # Extract regions from settings
        if film['Setting']:
            regions.update(extract_regions_from_setting(film['Setting']))
        
        # Collect other metadata
        if film['Studio']:
            studios.add(film['Studio'])
        if film['Director']:
            directors.add(film['Director'])
        if film['Genre']:
            genres.add(film['Genre'])
        if film['Year'] and pd.notna(film['Year']):
            years.append(int(film['Year']))
            eras.add(determine_era(film['Year']))
        
        # Categorize films by availability
        film_entry = {
            'title': film['Film Title'],
            'director': film['Director'] or 'Unknown',
            'studio': film['Studio'] or 'Unknown',
            'year': int(film['Year']) if film['Year'] and pd.notna(film['Year']) else 'Unknown',
            'format': 'Sound, B&W' if film['Year'] and film['Year'] > 1929 else 'Silent, B&W',
            'availability': film['Availability'] or 'Unknown'
        }
        
        if film['Availability'] and 'available' in str(film['Availability']).lower():
            extant_films.append(film_entry)
        else:
            lost_films.append(film_entry)
    
    # Sort films by year
    extant_films.sort(key=lambda x: x['year'] if isinstance(x['year'], int) else 0)
    lost_films.sort(key=lambda x: x['year'] if isinstance(x['year'], int) else 0)
    
    # Calculate statistics
    total_films = len(author_films)
    surviving_films = len(extant_films) 
    adaptation_span = f"{min(years)}-{max(years)}" if years else "Unknown"
    
    # Generate frontmatter
    frontmatter = f"""+++
title = "{clean_name}"
date = 2024-01-01
template = "author.html"

[taxonomies]
regions = {list(regions)}

[extra]
author_byline = "Alexandra Edwards"

# Author biographical info
author_dates = "{birth_year or 'BIRTH'}-{death_year or 'DEATH'}"
birth_date = "{birth_year or 'BIRTH DATE'}"
death_date = "{death_year or 'DEATH DATE'}"
occupation = ["novelist"]
locations = ["PLACE NAME"]

# Content flags
show_filmography = true
show_citation = true
show_related_films = true

# Author portrait
[extra.author_image]
url = "/images/{slug}-portrait.jpg"
alt = "{clean_name} portrait"
caption = "{clean_name}. Caption needed."

# Notable literary works - ADD MANUALLY
[[extra.notable_works]]
title = "TITLE"
year = 1900

# Film adaptation statistics
[extra.film_stats]
total_adaptations = {total_films}
surviving_films = {surviving_films}
adaptation_span = "{adaptation_span}"
studios = {sorted(list(studios))}
"""

    # Add extant adaptations
    if extant_films:
        frontmatter += "\n# Extant Adaptations\n"
        for film in extant_films:
            frontmatter += f"""[[extra.extant_adaptations]]
title = "{film['title']}"
director = "{film['director']}"
studio = "{film['studio']}"
year = {film['year']}
format = "{film['format']}"
availability = "{film['availability']}"

"""

    # Add lost adaptations
    if lost_films:
        frontmatter += "# Lost Adaptations\n"
        for film in lost_films:
            frontmatter += f"""[[extra.lost_adaptations]]
title = "{film['title']}"
director = "{film['director']}"
studio = "{film['studio']}"
year = {film['year']}
format = "{film['format']}"
status = "Lost"

"""

    # Add placeholder sections
    frontmatter += """
# DVD and streaming sources - ADD MANUALLY
[[extra.dvd_sources]]
title = "TITLE"
details = "DETAILS."

# Archival collections - ADD MANUALLY
[[extra.archive_collections]]
title = "NAME OF ARCHIVE"
details = "DETAILS"
+++

Content for {clean_name} goes here. 

## Early Life and Literary Career

[Add biographical information]

## Film Adaptations

[Add information about the adaptation of their work]

## Legacy and Impact

[Add information about their lasting influence]
""".format(clean_name=clean_name)

    # Write file
    filename = f"{slug}.md"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(frontmatter)
    
    print(f"Generated: {filename} ({total_films} films, {surviving_films} surviving)")
    return filepath

def main():
    # Configuration
    csv_file = "Updated Film Adaptations from U.S. Womens Novels  Short Stories 19101960Grid regional only  regional adaptations only 1.csv"
    output_dir = "content/author-profiles"
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Reading CSV file: {csv_file}")
    
    try:
        # Read CSV file
        df = pd.read_csv(csv_file)
        print(f"Loaded {len(df)} film records")
        
        # Group films by author
        author_films = defaultdict(list)
        
        for _, row in df.iterrows():
            author = row.get('Story author')
            if pd.notna(author) and str(author).strip():
                author = str(author).strip()
                author_films[author].append(row.to_dict())
        
        print(f"Found {len(author_films)} unique authors")
        
        # Generate profile for each author
        generated_files = []
        
        for author, films in author_films.items():
            if len(films) >= 1:  # Only generate for authors with at least 1 film
                filepath = generate_author_profile(author, films, output_dir)
                generated_files.append(filepath)
        
        print(f"\nGenerated {len(generated_files)} author profile files:")
        for filepath in generated_files[:10]:  # Show first 10
            print(f"  - {os.path.basename(filepath)}")
        
        if len(generated_files) > 10:
            print(f"  ... and {len(generated_files) - 10} more")
        
        print(f"\nFiles saved to: {output_dir}")
        print("\nNext steps:")
        print("1. Review the generated frontmatter for accuracy")
        print("2. Add biographical content to each file")
        print("3. Add notable works information")
        print("4. Add DVD/streaming sources and archival collections")
        print("5. Replace placeholder image URLs with actual images")
        
    except FileNotFoundError:
        print(f"Error: CSV file '{csv_file}' not found.")
        print("Make sure the CSV file is in the same directory as this script.")
    except Exception as e:
        print(f"Error processing CSV: {e}")

if __name__ == "__main__":
    main()
