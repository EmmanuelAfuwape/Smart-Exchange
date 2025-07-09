'''
import os
from flask import Flask, jsonify, request, send_from_directory
import requests
from datetime import datetime
import os

app = Flask(__name__, static_folder='static')

# In-memory user store for signup/login
users = {}

# In-memory storage for demonstration
user_data = {
    "mainBalance": 0.0,
    "baseCurrency": "USD",
    "transactions": []
}

user_currency_cache = None  # Cache user currency globally

@app.route('/proxy/user_location', methods=['GET'])
def proxy_user_location():
    global user_currency_cache
    app.logger.debug("Received request for user location proxy")
    try:
        response = requests.get("https://ipapi.co/json")
        response.raise_for_status()
        data = response.json()
        user_currency_cache = data.get('currency') or data.get('currency_code')
        app.logger.debug("User location fetched successfully")
        return jsonify(data)
    except requests.RequestException as e:
        app.logger.error(f"Error fetching user location: {e}")
        return jsonify({"error": "Failed to fetch user location", "details": str(e)}), 500

@app.route('/user_info', methods=['GET'])
def user_info():
    # Return combined user info including cached user currency and local currency balance
    main_balance = user_data["mainBalance"]
    base_currency = user_data["baseCurrency"]
    user_currency = user_currency_cache

    local_balance = None
    exchange_rate = None

    if user_currency:
        try:
            response = requests.get(f"https://open.er-api.com/v6/latest/{base_currency.upper()}")
            response.raise_for_status()
            data = response.json()
            rates = data.get("rates", {})
            exchange_rate = rates.get(user_currency.upper())
            if exchange_rate:
                local_balance = round(main_balance * exchange_rate, 2)
        except requests.RequestException as e:
            app.logger.error(f"Error fetching exchange rates in user_info: {e}")

    return jsonify({
        "mainBalance": main_balance,
        "baseCurrency": base_currency,
        "userCurrency": user_currency,
        "localBalance": local_balance,
        "exchangeRate": exchange_rate
    })

# Serve static files (CSS, JS, images)
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(os.path.join(app.root_path, 'static'), filename)

# Serve HTML pages
@app.route('/')
@app.route('/dashboard.html')
def serve_dashboard():
    return send_from_directory(app.root_path, 'SmartExchange_CurrencySwitcher/dashboard.html')

@app.route('/login.html')
def serve_login():
    return send_from_directory(app.root_path, 'SmartExchange_CurrencySwitcher/login.html')

@app.route('/deposit.html')
def serve_deposit():
    return send_from_directory(app.root_path, 'SmartExchange_CurrencySwitcher/deposit.html')

@app.route('/signup.html')
def serve_signup():
    return send_from_directory(app.root_path, 'SmartExchange_CurrencySwitcher/signup.html')

@app.route('/transfer.html')
def serve_transfer():
    return send_from_directory(app.root_path, 'SmartExchange_CurrencySwitcher/transfer.html')

@app.route('/payment_methods.html')
def serve_payment_methods():
    return send_from_directory(app.root_path, 'SmartExchange_CurrencySwitcher/payment_methods.html')

@app.route('/transfer_online.html')
def serve_transfer_online():
    return send_from_directory(app.root_path, 'SmartExchange_CurrencySwitcher/transfer_online.html')
'''