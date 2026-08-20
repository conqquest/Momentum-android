# Momentum: Mindful Habit Tracker ✨

Momentum is a beautifully designed, premium habit tracker and journaling app built to help you find your daily flow. With a focus on aesthetic minimalism and data visualization, it makes tracking your daily habits and emotional wellness feel rewarding.

## 🌟 Features

- **Beautiful UI/UX:** A warm, premium aesthetic (cocoa and golden accents) that feels incredibly clean and responsive. Includes full Dark Mode support.
- **Premium Analytics (Journey View):**
  - **Contribution Heatmap:** GitHub-style activity grid showing your habit completion over the last 6 months.
  - **Mood Index:** Smooth Catmull-Rom sparkline charts tracking your emotional wellness.
  - **Habit Wave:** Visual area charts mapping out your daily check-in ratios.
  - **Emotion Splits:** Dynamic SVG donut charts breaking down your logged moods (Happy, Calm, Sad, Anxious).
- **Customizable Widgets:** A "Widget Studio" to preview how your stats will look on your Android home screen with neon glowing themes.
- **Smart Journaling:** Log daily reflections, track weather, and record your current emotional state.
- **Offline First & Cloud Sync:** Use it entirely offline (saving to local storage), or seamlessly connect to Firebase to sync your data across devices.
- **Android Ready:** Built with Capacitor, ready to be compiled into a native Android APK with adaptive launcher icons.

## 🛠️ Tech Stack

- **Frontend:** React, Vite
- **Styling:** Vanilla CSS with a carefully crafted design system (no heavy CSS frameworks)
- **Icons:** Lucide React
- **Mobile Integration:** Capacitor (for native Android builds and widgets)
- **Backend/Auth:** Firebase (Firestore & Google Authentication)

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js and npm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/conqquest/Momentum-android.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Momentum-android
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Android

This project uses Capacitor to wrap the web app into a native Android application.

1. Build the web assets:
   ```bash
   npm run build
   ```
2. Sync the assets to the Android project:
   ```bash
   npx cap sync android
   ```
3. Open Android Studio to build the APK:
   ```bash
   npx cap open android
   ```

## ☁️ GitHub Pages Deployment

The app is configured to be deployed automatically to GitHub Pages using GitHub Actions. Any push to the `main` branch triggers the deployment workflow (`build-apk.yml`). 

*Note: Ensure the repository settings have GitHub Pages source set to the `gh-pages` branch.*

## 🤝 Contributing

Contributions are always welcome! Feel free to open an issue or submit a pull request if you have ideas for new features or improvements.
