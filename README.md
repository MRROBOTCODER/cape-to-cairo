# 🌍 Cape to Cairo — Imported Foods App

A warm, rustic South African farm-style web app for an imported foods store.
Built with **Python (Flask)** on the backend and vanilla **HTML/CSS/JS** on the frontend.

---

## 📁 Project Structure

```
cape_to_cairo/
├── app.py                  ← Flask backend (routes + product data)
├── requirements.txt        ← Python dependencies
├── templates/
│   └── index.html          ← Main HTML page
└── static/
    ├── css/
    │   └── style.css       ← All styling (SA farm / plaas aesthetic)
    └── js/
        └── app.js          ← Frontend interactions (cart, search, auth)
```

---

## ⚙️ Setup Instructions

### Step 1 — Make sure Python is installed

Open a terminal and check:
```bash
python --version
```
You need **Python 3.8 or higher**. Download from https://python.org if needed.

---

### Step 2 — Create a virtual environment (recommended)

Navigate to the project folder:
```bash
cd cape_to_cairo
```

Create the virtual environment:
```bash
python -m venv venv
```

Activate it:
- **Windows:**   `venv\Scripts\activate`
- **Mac/Linux:** `source venv/bin/activate`

You should see `(venv)` appear in your terminal prompt.

---

### Step 3 — Install dependencies

```bash
pip install -r requirements.txt
```

This installs Flask. That's the only dependency needed.

---

### Step 4 — Run the app

```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

---

### Step 5 — Open in your browser

Go to: **http://localhost:5000**

The app is running! 🎉

---

## 🧪 Using the App (Demo for Bosses)

| Feature | How to use |
|---|---|
| **Browse products** | Scroll the product grid on the main page |
| **Search** | Type in the search bar (e.g. "Morocco" or "Spices") |
| **Filter by category** | Click the category chips below the search bar |
| **Add to cart** | Click "Voeg By" on any product |
| **View cart** | Click the "Mandjie 🧺" button in the header |
| **Adjust quantities** | Use + / − buttons in the cart drawer |
| **Sign in** | Click "Teken In" or try to checkout — a login modal appears |
| **Place order** | Once signed in, click "Plaas Bestelling" in the cart |

---

## 🛑 Stopping the App

Press **Ctrl + C** in the terminal.

---

## 📦 Notes for Development

- Products are stored in `app.py` as a Python list — easy to replace with a real database later.
- Prices are displayed in **ZAR (Rand)** using an approximate conversion rate.
- The login system uses Flask sessions (no real password hashing — suitable for demo only).
- To use a real database in production, replace the `PRODUCTS` list with SQLAlchemy queries.
