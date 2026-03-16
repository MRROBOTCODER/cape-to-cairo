from flask import Flask, render_template, request, jsonify, session
import random, string
from datetime import date

app = Flask(__name__)
app.secret_key = "cape-to-cairo-secret-2024"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = 86400

PRODUCTS = [
    {"id": 1,  "name": "Classic Beef Biltong (200g)",   "price": 18.99, "category": "Biltong & Jerky",  "description": "Traditional South African air-dried beef biltong — perfectly spiced and tender.",       "image": "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80", "badge": ""},
    {"id": 2,  "name": "Peri-Peri Biltong (200g)",      "price": 19.99, "category": "Biltong & Jerky",  "description": "Fiery peri-peri spiced biltong for those who like it hot.",                            "image": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80", "badge": "Hot"},
    {"id": 3,  "name": "Drywors Sticks (150g)",         "price": 14.99, "category": "Biltong & Jerky",  "description": "Thin, dry South African sausage sticks — a braai favourite and perfect snack.",        "image": "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400&q=80", "badge": ""},
    {"id": 4,  "name": "Beef Jerky Original (100g)",    "price": 12.99, "category": "Biltong & Jerky",  "description": "Slow-dried beef jerky with a classic smoky, savoury flavour.",                        "image": "https://images.unsplash.com/photo-1622542086427-45f878e78042?w=400&q=80", "badge": ""},
    {"id": 5,  "name": "Ouma Rusks (500g)",             "price": 11.99, "category": "Groceries",        "description": "South Africa's most loved dunking rusk — perfect with your morning coffee.",           "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80", "badge": "Best Seller"},
    {"id": 6,  "name": "Rooibos Tea (100 bags)",        "price": 9.99,  "category": "Groceries",        "description": "Caffeine-free South African red bush tea — naturally sweet and earthy.",              "image": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&q=80", "badge": ""},
    {"id": 7,  "name": "Mrs Balls Chutney (470g)",      "price": 8.49,  "category": "Groceries",        "description": "The iconic South African fruit chutney. A braai table essential.",                     "image": "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&q=80", "badge": "Iconic"},
    {"id": 8,  "name": "Chakalaka Relish (400g)",       "price": 6.99,  "category": "Groceries",        "description": "Spicy South African vegetable relish — delicious with pap or braai meat.",            "image": "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", "badge": ""},
    {"id": 9,  "name": "Nik Naks Cheese (120g)",        "price": 4.49,  "category": "Groceries",        "description": "South Africa's favourite cheesy corn snack — light, crunchy and totally addictive.",   "image": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80", "badge": ""},
    {"id": 10, "name": "Braai Spice Rub (200g)",        "price": 9.99,  "category": "BBQ & Braai",      "description": "The ultimate all-purpose South African braai seasoning for meat and veg.",             "image": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80", "badge": ""},
    {"id": 11, "name": "Boerewors Spice Kit",           "price": 13.99, "category": "BBQ & Braai",      "description": "Make your own boerewors at home — everything you need in one kit.",                   "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80", "badge": "New"},
    {"id": 12, "name": "Peri-Peri Sauce (250ml)",       "price": 7.99,  "category": "BBQ & Braai",      "description": "Authentic peri-peri chili sauce — great as a marinade or dipping sauce.",             "image": "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=400&q=80", "badge": ""},
    {"id": 13, "name": "Biltong Spice Mix (500g)",      "price": 15.99, "category": "Biltong Making",   "description": "Traditional coriander and spice blend for making your own biltong at home.",          "image": "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?w=400&q=80", "badge": ""},
    {"id": 14, "name": "Biltong Maker Box (Small)",     "price": 49.99, "category": "Biltong Making",   "description": "Compact biltong drying box — makes up to 1kg of biltong at a time.",                 "image": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80", "badge": "Popular"},
    {"id": 15, "name": "Curing Salt (250g)",            "price": 6.99,  "category": "Biltong Making",   "description": "Food-grade curing salt for safe home biltong and drywors production.",               "image": "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&q=80", "badge": ""},
    {"id": 16, "name": "Cast Iron Potjie (No. 3)",      "price": 89.99, "category": "Potjies",          "description": "Traditional South African cast iron three-legged pot — perfect for outdoor cooking.",  "image": "https://images.unsplash.com/photo-1585325701956-60dd9c8e6679?w=400&q=80", "badge": ""},
    {"id": 17, "name": "Potjie Spice Pack",             "price": 12.99, "category": "Potjies",          "description": "A curated selection of spices for making an authentic South African potjiekos.",      "image": "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80", "badge": ""},
    {"id": 18, "name": "SA Taste of Home Gift Box",     "price": 49.99, "category": "Gifts & Crafts",   "description": "A curated box of South African pantry favourites — perfect for homesick expats.",     "image": "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80", "badge": "Gift"},
    {"id": 19, "name": "Braai Master Gift Set",         "price": 64.99, "category": "Gifts & Crafts",   "description": "Everything a braai master needs — spices, sauces, and accessories in one great gift.", "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80", "badge": "Gift"},
    {"id": 20, "name": "SA Flag Bottle Opener",         "price": 9.99,  "category": "Gifts & Crafts",   "description": "Sturdy stainless steel bottle opener with the South African flag.",                   "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", "badge": ""},
]

PROMOTIONS = [
    {"id": 1, "title": "Braai Season Bundle",   "description": "Get 20% off all BBQ & Braai products this month. Stock up before the weekend!", "badge": "20% OFF",   "colour": "#b84520"},
    {"id": 2, "title": "Biltong Bulk Deal",     "description": "Buy any 3 biltong products and get the cheapest one FREE. Limited time offer.",  "badge": "3 for 2",   "colour": "#5a7a4a"},
    {"id": 3, "title": "Gift Box Special",      "description": "Free shipping on all gift boxes over $50 — perfect for sending a taste of home.", "badge": "Free Ship", "colour": "#c9943a"},
]

PRIZES = [
    {"id": 1, "label": "10% OFF",        "type": "discount", "value": 10, "colour": "#b84520", "description": "10% off your next order!",                  "code_prefix": "SAVE10"},
    {"id": 2, "label": "Mystery Gift",   "type": "mystery",  "value": 0,  "colour": "#5a7a4a", "description": "A surprise gift added to your next order!", "code_prefix": "MYSTERY"},
    {"id": 3, "label": "5% OFF",         "type": "discount", "value": 5,  "colour": "#c8a96e", "description": "5% off your next order!",                   "code_prefix": "SAVE5"},
    {"id": 4, "label": "15% OFF",        "type": "discount", "value": 15, "colour": "#6b3a1e", "description": "15% off your next order!",                  "code_prefix": "SAVE15"},
    {"id": 5, "label": "Try Again",      "type": "none",     "value": 0,  "colour": "#9c5a2e", "description": "Better luck tomorrow!",                     "code_prefix": ""},
    {"id": 6, "label": "Mystery Gift",   "type": "mystery",  "value": 0,  "colour": "#3b1f0c", "description": "A surprise gift added to your next order!", "code_prefix": "MYSTERY"},
    {"id": 7, "label": "20% OFF",        "type": "discount", "value": 20, "colour": "#d4882a", "description": "20% off your next order — big win!",        "code_prefix": "SAVE20"},
    {"id": 8, "label": "Try Again",      "type": "none",     "value": 0,  "colour": "#7a4a28", "description": "Better luck tomorrow!",                     "code_prefix": ""},
]

CATEGORIES = ["All", "Biltong & Jerky", "Groceries", "BBQ & Braai", "Biltong Making", "Potjies", "Gifts & Crafts"]

def generate_code(prefix):
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{suffix}"

# ── Routes ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html", categories=CATEGORIES, promotions=PROMOTIONS)

@app.route("/api/products")
def get_products():
    search   = request.args.get("search", "").lower()
    category = request.args.get("category", "All")
    results  = PRODUCTS
    if category != "All":
        results = [p for p in results if p["category"] == category]
    if search:
        results = [p for p in results if
                   search in p["name"].lower() or
                   search in p["category"].lower() or
                   search in p["description"].lower()]
    return jsonify(results)

@app.route("/api/login", methods=["POST"])
def login():
    data  = request.get_json()
    email = data.get("email", "")
    name  = data.get("name") or email.split("@")[0]
    if email and "@" in email:
        session.permanent = True
        session["user"] = {"name": name, "email": email}
        return jsonify({"success": True, "user": session["user"]})
    return jsonify({"success": False, "error": "Please enter a valid email address"}), 400

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

@app.route("/api/session")
def get_session():
    return jsonify({"user": session.get("user")})

@app.route("/api/checkout", methods=["POST"])
def checkout():
    if "user" not in session:
        return jsonify({"success": False, "error": "Not logged in"}), 401
    data  = request.get_json()
    cart  = data.get("cart", [])
    if not cart:
        return jsonify({"success": False, "error": "Cart is empty"}), 400
    total = sum(item["price"] * item["qty"] for item in cart)
    return jsonify({
        "success":  True,
        "message":  f"Order placed! Total: ${total:.2f} AUD",
        "order_id": "CTC-" + str(abs(hash(str(cart))))[:6]
    })

@app.route("/api/rewards/status")
def rewards_status():
    if "user" not in session:
        return jsonify({"success": False, "error": "Not logged in"}), 401
    today    = str(date.today())
    can_spin = session.get("last_spin_date") != today
    return jsonify({
        "success":   True,
        "can_spin":  can_spin,
        "prizes":    PRIZES,
        "my_prizes": session.get("my_prizes", []),
    })

@app.route("/api/rewards/spin", methods=["POST"])
def spin_wheel():
    if "user" not in session:
        return jsonify({"success": False, "error": "Not logged in"}), 401
    today = str(date.today())
    if session.get("last_spin_date") == today:
        return jsonify({"success": False, "error": "You have already spun today!"}), 400
    weights = [15, 12, 18, 8, 20, 12, 5, 20]
    prize   = random.choices(PRIZES, weights=weights, k=1)[0]
    session["last_spin_date"] = today
    result  = {
        "prize_id":    prize["id"],
        "label":       prize["label"],
        "type":        prize["type"],
        "description": prize["description"],
        "colour":      prize["colour"],
        "code":        None,
    }
    if prize["type"] in ("discount", "mystery"):
        code   = generate_code(prize["code_prefix"])
        result["code"] = code
        my_prizes = session.get("my_prizes", [])
        my_prizes.append({"label": prize["label"], "description": prize["description"], "code": code, "date": today})
        session["my_prizes"] = my_prizes
        session.modified = True
    return jsonify({"success": True, "result": result})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
