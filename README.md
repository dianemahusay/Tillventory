# Tillventory 📦

**Tillventory** is an all-in-one mobile application designed for small business and shop owners to manage inventory, process point-of-sale (POS) transactions, oversee staff activities, and generate automated sales reports—all while promoting paperless, eco-friendly store management.

---

## 📱 Features

- **Integrated Point-of-Sale (POS):** Process sales directly on mobile with categorized item selection (`Drinks`, `Foods`, `Pastries`) and automatic total calculation.
- **Real-Time Inventory Tracking:** Stock levels update dynamically upon checkout to avoid discrepancies and manual tallying.
- **Automated Restock Indicators:** Instant low-stock alerts under a dedicated "Needs Attention" panel.
- **Staff & Activity Logging:** Monitor store operations and keep track of orders rung up by team members.
- **Sales Reporting & Analytics:** Access daily sales summaries, order counts, and performance metrics.
- **Paperless Workflow:** Digital receipts and logs help cut down on paper waste and operational friction.

---

## 🛠️ Tech Stack

- **Frontend / Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [TailwindCSS (NativeWind)](https://www.nativewind.dev/)
- **Backend & Database:** [Appwrite](https://appwrite.io/) (Authentication, Cloud Database, Storage)

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm
- Expo Go app on your physical device or an active iOS Simulator / Android Emulator
- An active [Appwrite](https://appwrite.io/) instance or project

### Installation & Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dianemahusay/Tillventory.git
   cd Tillventory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Appwrite credentials:
   ```env
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
   EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
   EXPO_PUBLIC_APPWRITE_COLLECTION_PRODUCTS=your_products_collection_id
   EXPO_PUBLIC_APPWRITE_COLLECTION_ORDERS=your_orders_collection_id
   ```

4. **Start the development server:**
   ```bash
   npx expo start
   ```

5. **Run the App:**
   - Scan the QR code using the **Expo Go** app (Android) or the **Camera app** (iOS).
   - Or press `a` for Android Emulator / `i` for iOS Simulator in your terminal.

---

## 📁 Project Structure

```text
Tillventory/
├── app/                  # Expo Router file-based routes, screens, and layouts
├── assets/               # App icons, splash screens, and images
├── services/             # Appwrite API clients, database queries, and service functions
├── .gitignore            # Git ignore rules
├── AGENTS.md             # AI agents instructions and workspace configuration
├── CLAUDE.md             # Claude project guidelines and context
├── README.md             # Project documentation
├── app.json              # Expo configuration file
├── babel.config.js       # Babel compiler configuration
├── eslint.config.js      # ESLint linting rules
├── metro.config.js       # Metro bundler configuration
├── nativewind-env.d.ts   # TypeScript declarations for NativeWind
├── package.json          # Project dependencies and npm scripts
├── tailwind.config.js    # TailwindCSS styling configuration
└── tsconfig.json         # TypeScript configuration
```

---

## 👥 Contributors

- **Diane Mahusay** – *UI/UX Design, Frontend Development, QA*
- **Sybil Micarandayo** – *Backend Development & Database Architecture*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
