## Create `templates/shortcodes/image.html`:

```html
{# Flexible image shortcode for static/images #}
<figure class="image-figure {% if align %}align-{{ align }}{% endif %} {% if class %}{{ class }}{% endif %}" 
        {% if width %}style="max-width: {{ width }};"{% endif %}>
    {% if link %}
    <a href="{{ link }}" {% if link_target %}target="{{ link_target }}"{% endif %}>
    {% endif %}
        <img src="/images/{{ src }}" 
             alt="{{ alt }}"
             {% if title %}title="{{ title }}"{% endif %}
             {% if loading %}loading="{{ loading }}"{% else %}loading="lazy"{% endif %}
             {% if sizes %}sizes="{{ sizes }}"{% endif %}>
    {% if link %}
    </a>
    {% endif %}
    {% if caption %}
    <figcaption>{{ caption | safe }}</figcaption>
    {% endif %}
</figure>

<style>
.image-figure {
    margin: 2rem auto;
    text-align: center;
}

.image-figure img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
}

.image-figure figcaption {
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
    text-align: center;
}

/* Alignment options */
.align-left {
    float: left;
    margin: 0 2rem 1rem 0;
    text-align: left;
}

.align-right {
    float: right;
    margin: 0 0 1rem 2rem;
    text-align: right;
}

.align-center {
    display: block;
    margin: 2rem auto;
    text-align: center;
}

.align-full {
    margin: 2rem -2rem;
    max-width: calc(100% + 4rem);
    width: calc(100% + 4rem);
}

/* Size presets */
.size-small {
    max-width: 300px;
}

.size-medium {
    max-width: 600px;
}

.size-large {
    max-width: 900px;
}

/* Style variations */
.rounded img {
    border-radius: 8px;
}

.shadow img {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.border img {
    border: 1px solid #ddd;
}

.polaroid {
    background: white;
    padding: 0.5rem 0.5rem 3rem 0.5rem;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.polaroid img {
    margin-bottom: 0;
}

/* Clear floats */
.clear {
    clear: both;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .align-left, .align-right {
        float: none;
        margin: 2rem auto;
    }
    
    .align-full {
        margin: 2rem 0;
        max-width: 100%;
        width: 100%;
    }
}
</style>
```

## Usage Examples:

### Basic image:
```markdown
{{ image(src="giant-production-still.jpg", alt="Production still from Giant") }}
```

### With caption and alignment:
```markdown
{{ image(src="ferber-on-set.jpg", alt="Edna Ferber visiting the Giant set", caption="Edna Ferber with director George Stevens during production", align="right", width="400px") }}
```

### Multiple style options:
```markdown
{{ image(src="limberlost-swamp.jpg", alt="The Limberlost Swamp", caption="The wetlands that inspired Gene Stratton-Porter", class="shadow rounded size-medium") }}
```

### Clickable image:
```markdown
{{ image(src="giant-poster-thumbnail.jpg", alt="Giant movie poster", link="/images/giant-poster-full.jpg", link_target="_blank", caption="Click for full size") }}
```

### Polaroid style:
```markdown
{{ image(src="mary-pickford.jpg", alt="Mary Pickford", class="polaroid size-small", align="left", caption="Mary Pickford, 1920") }}
```

### Full-width dramatic image:
```markdown
{{ image(src="gone-with-wind-burning-atlanta.jpg", alt="Burning of Atlanta scene", class="align-full shadow", caption="The famous 'Burning of Atlanta' sequence") }}
```

## Parameters:

- **src** (required): Filename in `/static/images/`
- **alt** (required): Alt text for accessibility
- **caption**: Caption text (supports HTML with `safe` filter)
- **align**: `left`, `right`, `center`, or `full`
- **width**: Any CSS width value (e.g., "300px", "50%")
- **class**: Additional CSS classes (`rounded`, `shadow`, `border`, `polaroid`, `size-small`, `size-medium`, `size-large`)
- **link**: URL to link to when clicked
- **link_target**: Target for link (e.g., "_blank")
- **title**: Hover title text
- **loading**: Override lazy loading (default is "lazy")
- **sizes**: Responsive sizes attribute

You can combine multiple classes for different effects:
```markdown
{{ image(src="film-still.jpg", alt="Film still", class="rounded shadow size-medium") }}
```