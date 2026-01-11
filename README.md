✨ Perfect Day - AI Itinerary Planner
Perfect Day is a full-stack web application that uses Artificial Intelligence to craft the ideal 24-hour schedule based on your current location. It provides a seamless flow from AI generation to manual editing, route mapping, and exporting.

🚀 Features
Geolocation-Based Magic: Uses your browser’s location to find local gems and hotspots.

AI Generation (Gemini 1.5 Flash): Integrates with Google's Gemini via a Django backend to generate unique, logical, and fun daily plans.

Interactive Editor: * Add/Remove activities.

Edit times and descriptions.

"Quick Add" suggestions from the AI.


One-Click Export: Save your final itinerary as a high-quality PNG image or PDF document.

Mobile Optimized: Fully responsive design that centers content and stacks beautifully on smaller screens.

<img width="1447" height="909" alt="image" src="https://github.com/user-attachments/assets/9d752e82-99dc-40c6-8964-6bf59f26d86d" />

🛠️ Tech Stack
Frontend:

React (Vite)

html2canvas & jspdf (For exports)

@react-google-maps/api (For routing)

Backend:

Django

Google Generative AI SDK (Gemini API)

Python-dotenv (For security)

⚙️ Installation & Setup
1. Backend Setup (Django)
Bash

# Clone the repository
cd backend

# Install dependencies
pip install requirements

# Create a .env file
echo "GEMINI_API_KEY=your_key_here" > .env

# Run the server
python manage.py runserver
2. Frontend Setup (React/Vite)
Bash

# Navigate to frontend
cd frontend

# Install dependencies
npm install html2canvas jspdf


# Start the dev server with network access
npm run dev -- --host

🔒 Security Best Practices
This project is built with security in mind:

API Keys: No API keys are hardcoded. They are stored in .env files which are ignored by Git.

Server-Side AI: Gemini API calls are handled by Django, preventing users from seeing your AI credentials in the browser network tab.

Map Restrictions: (Recommended) The Google Maps key should be restricted to your specific domain or localhost in the Google Cloud Console.

📝 How to Use
Click "Generate New Plan" to fetch a custom day based on your coordinates.

Use the Editor to tweak the times or change the activities to your liking.

Download your plan using the Save as Image or Save as PDF buttons.


https://github.com/user-attachments/assets/cd594945-e0a8-4f02-a303-cf2445d886d9

Example of the finished plan:

<img width="1484" height="1190" alt="my-perfect-day" src="https://github.com/user-attachments/assets/7b345b46-b44f-4c1c-a0d5-31d65e49ca23" />

📄 License
MIT License - Feel free to use this for your own travel projects!
