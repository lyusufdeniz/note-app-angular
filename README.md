# Papirus - Modern Note-Taking App

Papirus is a sleek, iOS-styled note-taking application built with Angular. It offers a beautiful and intuitive interface for managing your notes with powerful features and seamless user experience.

![Papirus Logo](src/assets/favicon/favicon.svg)

## Features

- 📝 Create, edit, and delete notes with a rich text editor
- 🏷️ Organize notes with colorful tags
- 🔍 Instant search functionality
- 📱 Responsive design with iOS-style interface
- 🌓 Dark/Light theme support
- 🌐 Multi-language support (English/Turkish)
- ⏰ Customizable time format (12/24 hour)
- 💾 Import/Export notes for backup
- ♾️ Infinite scroll for smooth note browsing
- 📊 Smart date-based note grouping

## Getting Started

### Prerequisites

- Angular CLI (v17 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/papirus.git
cd papirus
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

4. Open your browser and navigate to `http://localhost:4200`

### Building for Production

To build the application for production:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/note-app` directory.

## Technology Stack

- Angular 17
- TypeScript
- SCSS
- SweetAlert2
- TinyMCE
- Font Awesome
- Flag Icons

## Features in Detail

### Note Management
- Create new notes with a single click
- Rich text editing with TinyMCE
- Auto-save functionality
- Note preview with formatted content
- Delete notes with confirmation

### Tag System
- Create custom tags with color selection
- Filter notes by tags
- Manage tags (create, edit, delete)
- Multiple tags per note

### User Interface
- iOS-style design elements
- Smooth animations and transitions
- Responsive layout for all devices
- Touch-friendly interface

### Data Management
- Local storage for persistent data
- Import/Export functionality for backup
- Merge or replace options when importing

### Customization
- Dark/Light theme toggle
- Language selection (EN/TR)
- Time format preference (12/24 hour)
- Custom tag colors

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Font Awesome for icons
- Flag Icons for language flags
- TinyMCE for rich text editing
- SweetAlert2 for beautiful dialogs
