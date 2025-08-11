# Markdown Renderer Usage Examples

## Basic Usage

```tsx
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

// Simple usage
<MarkdownRenderer content={testimonialContent} />

// With custom styling
<MarkdownRenderer 
  content={testimonialContent}
  className="prose-lg"
/>

// Without prose styling (for custom layouts)
<MarkdownRenderer 
  content={testimonialContent}
  prose={false}
  className="custom-styles"
/>
```

## Supported Markdown Features

The MarkdownRenderer supports all standard markdown features including:

- **Bold text** and *italic text*
- # Headers of various levels
- Bullet lists
- Numbered lists
- > Blockquotes
- [Links](https://example.com)
- `Inline code`
- Code blocks with syntax highlighting
- Horizontal rules
- Tables (via GitHub Flavored Markdown)

## Example Testimonial Markdown

```markdown
## Client Testimonials

> "Working with [Name] was an absolute game-changer for our podcast. Their insights into **AI and automation** were exactly what our audience needed." 
> — *Jane Doe, Host of TechTalk Podcast*

### Key Feedback Points:

1. **Exceptional Communication** - Always prepared and articulate
2. **Deep Technical Knowledge** - Explained complex topics simply
3. **Engaging Personality** - Our listeners loved the episode!

---

*"One of our highest-rated episodes!"* - Another happy host
```

## Customization

The component uses Tailwind CSS classes and can be easily customized by:

1. Passing custom `className` props
2. Modifying the component's default styles
3. Overriding specific element rendering in the `components` prop