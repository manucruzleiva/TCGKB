# Changelog

All notable changes to the Pokemon TCG Knowledge Base project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Real-time comment updates using WebSocket
- Real-time relative time updates for comments (auto-refresh)
- Admin dashboard analytics improvements
- **Support Page**: New `/support` page with GitHub Sponsors integration
- **Footer Support Link**: Heart icon link to support page in footer (replaces floating button)
- **Support Tiers**: Display of Supporter, Champion, and Hero tier benefits
- **Monthly Costs Transparency**: Visual breakdown of platform running costs

---

## [1.5.0] - 2024-12-17

### Added
- **Theme Transition Animation**: Smooth sunrise/sunset fade effect when switching between light and dark themes
- **Language Morph Animation**: Text morphing effect when changing languages
- **Changelog Page**: New changelog section in profile dropdown with animated display
- **Card Rotation Indicators**: Yellow "G!" badge on cards about to rotate from Standard format
- **Rotation Tooltips**: Hover to see rotation date and days remaining

### Changed
- Improved card mention chip rendering with regex-based parsing
- Updated rotation configuration to show G mark as rotating soon (2026 rotation)
- Enhanced comment display to properly show ability mentions

### Fixed
- Fixed bracket display issue in comment mentions `[@CardName.AbilityName]`
- Fixed ability type detection for card mention chips
- Improved pattern matching for card mentions in comments

---

## [1.4.0] - 2024-12-16

### Added
- **Card Mention System**: Type `@` to mention cards in comments with visual chips
- **Ability Selection**: Type `.` after selecting a card to choose specific attacks or abilities
- **Card Mention Tooltips**: Hover over mentions to see card image and ability details
- **Alternate Arts Carousel**: Navigate through different arts/reprints of the same card
- **Alternate Arts Detection**: Automatic detection of reprints based on matching name, attacks, and abilities

### Changed
- Card mentions now display as interactive chips with card icons
- Improved autocomplete to include attacks and abilities data
- Enhanced chip styling with gradients for ability mentions

---

## [1.3.0] - 2024-12-15

### Added
- **Moderation Dashboard**: Admin panel for managing comments and users
- **Comment Moderation**: Ability to moderate/restore comments with reasons
- **User Management**: View and manage user accounts
- **Activity Analytics**: Charts showing platform activity over time
- **Comment Reactions**: Users can react to comments with emojis

### Changed
- Improved comment threading with collapse/expand functionality
- Enhanced admin permissions system

---

## [1.2.0] - 2024-12-14

### Added
- **Dark Mode**: Full dark theme support with system preference detection
- **Language Support**: English and Spanish translations
- **Date Format Settings**: Customizable date display formats
- **User Settings Page**: Centralized settings management

### Changed
- Improved UI responsiveness across all devices
- Better accessibility with ARIA labels

---

## [1.1.0] - 2024-12-13

### Added
- **Comment System**: Users can leave comments on cards
- **Nested Replies**: Support for threaded comment discussions
- **User Authentication**: Register and login functionality
- **Card Reactions**: React to cards with emojis

### Changed
- Enhanced card detail page layout
- Improved search performance with caching

---

## [1.0.0] - 2024-12-12

### Added
- **Card Search**: Search Pokemon TCG cards by name
- **Card Details**: View detailed card information including attacks, abilities, and set info
- **Infinite Scroll**: Seamlessly load more cards as you scroll
- **Card Images**: High-quality card images from Pokemon TCG API
- **Responsive Design**: Works on desktop and mobile devices

---

## Types of Changes

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Now removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
