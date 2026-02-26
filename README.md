# My Homepage - Test Project

A simple, responsive HTML/CSS homepage project created as a test/prototype.

## Features

- **Beautiful Gradient Background**: Purple-blue gradient background for a modern look
- **Circular Profile Photo**: Profile image cropped in a circle with hover effects
- **Hello World Intro**: Classic greeting displayed prominently
- **Contact Button**: Non-functional contact button (for UI demonstration)
- **Responsive Design**: Centered layout that works on different screen sizes
- **Modern Styling**: Includes frosted glass effect with backdrop blur

## Project Structure

```
my-homepage/
├── index.html      # Main HTML file
├── style.css       # Stylesheet
└── README.md       # This file
```

## Getting Started

1. Clone or download the repository
2. Open `index.html` in your web browser
3. To customize your photo, replace the image URL in `index.html` with your own photo

## Customization

### To change the background gradient:
Edit the `background` property in `style.css` within the `body` selector:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### To replace the profile photo:
Edit the `src` attribute in `index.html`:
```html
<img src="your-photo-url-here.jpg" alt="Profile Photo" class="profile-photo">
```

### To update the greeting text:
Edit the text inside the `<h1>` tag in `index.html`

## Browser Support

Works with all modern browsers (Chrome, Firefox, Safari, Edge)

## Notes

This is a test/prototype project created to explore basic web design patterns with HTML and CSS.
