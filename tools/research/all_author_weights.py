#!/usr/bin/env python3
"""
Complete list of author weights based on the CSV data from Hollywood Regionalism project.
All unique authors from the "Story author" column with weights for last name sorting.
"""

def get_last_name(full_name):
    """Extract last name from full name, handling compound names."""
    if not full_name or full_name == '-':
        return ''
    
    # Handle compound last names like "Stratton-Porter"
    parts = full_name.split()
    if len(parts) >= 2:
        return parts[-1]  # Take the last part
    return full_name

def calculate_weight(last_name):
    """Calculate weight based on alphabetical position of last name."""
    if not last_name:
        return 999999  # Put entries without last names at the end
    
    # Convert to lowercase for consistent sorting
    name = last_name.lower()
    
    # Calculate weight based on first 3 characters
    weight = 0
    multipliers = [10000, 100, 1]
    
    for i, char in enumerate(name[:3]):
        if char.isalpha():
            char_value = ord(char) - ord('a') + 1
            weight += char_value * multipliers[i]
    
    return weight

# All unique authors from your CSV (excluding '-' entries)
authors = [
    "Alice Hegan Rice",
    "Alice MacGowan", 
    "Anzia Yezierska",
    "Belle K. Maniates",
    "Bess Streeter Aldrich",
    "Betty MacDonald",
    "Betty Smith",
    "Carson McCullers",
    "Cid Ricketts Sumner",
    "Dorothy M. Johnson",
    "Edith Roberts",
    "Edna Ferber",
    "Edna Mae Baker",
    "Eleanor H. Porter",
    "Eleanor Mercein Kelly",
    "Ellen Glasgow",
    "Fannie Hurst",
    "Gene Gauntier",
    "Gene Stratton-Porter",
    "Gertrude Atherton",
    "Grace Miller White",
    "Harriet Beecher Stowe",
    "Harriet Comstock",
    "Helen Grace Carlisle",
    "Helen Hunt Jackson",
    "Kate Douglas Wiggin",
    "Kate Langley Bosher",
    "Kathryn Forbes",
    "Lois Zellner",
    "Margaret Cousins",
    "Margaret Deland",
    "Margaret Mitchell",
    "Margaret Prescott Montague",
    "Marjorie Kinnan Rawlings",
    "Mary Elizabeth Vroman",
    "Mary O'Hara",
    "Mary Rider",
    "Mary Wilkins Freeman",
    "Myra Kelly",
    "Rebecca Yancey Williams",
    "Ruth Sawyer",
    "Winnifred Dunn"
]

print("COMPLETE AUTHOR WEIGHTS FOR HOLLYWOOD REGIONALISM")
print("=" * 60)
print()

# Calculate weights for all authors
author_weights = []
for author in authors:
    last_name = get_last_name(author)
    weight = calculate_weight(last_name)
    author_weights.append((author, last_name, weight))

# Sort by weight (alphabetical by last name)
author_weights.sort(key=lambda x: x[2])

print("Authors in alphabetical order by last name:")
print("-" * 60)
for i, (author, last_name, weight) in enumerate(author_weights, 1):
    print(f"{i:2d}. {author:<35} (Last: {last_name:<15} Weight: {weight})")

print()
print("FRONTMATTER WEIGHTS TO ADD:")
print("=" * 60)
print()

for author, last_name, weight in author_weights:
    # Convert to likely filename
    filename = author.lower().replace(" ", "-").replace(".", "")
    print(f"# {filename}.md")
    print(f"weight = {weight}  # Sorts by: {last_name}")
    print()

print("QUICK REFERENCE - COPY/PASTE WEIGHTS:")
print("=" * 60)
for author, last_name, weight in author_weights:
    print(f"{author}: {weight}")
