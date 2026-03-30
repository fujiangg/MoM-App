import requests
import sys

BASE_URL = "http://localhost:8000"

def log(msg, success=True):
    symbol = "✅" if success else "❌"
    print(f"{symbol} {msg}")

def test_backend():
    # 1. Signup
    username = "testuser"
    password = "password123"
    
    # Clean up potentially existing user (re-run safety not guaranteed without DB reset, but let's try login first)
    
    print("--- Testing Auth ---")
    signup_payload = {"username": username, "password": password}
    response = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload)
    
    if response.status_code == 200:
        log("Signup Successful")
    elif response.status_code == 400 and "already registered" in response.text:
        log("User already exists (Signup skipped)")
    else:
        log(f"Signup Failed: {response.text}", False)
        # return # Continue to try login anyway

    # 2. Login
    login_payload = {"username": username, "password": password}
    response = requests.post(f"{BASE_URL}/auth/login", data=login_payload)
    if response.status_code != 200:
        log(f"Login Failed: {response.text}", False)
        return
    
    token = response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    log("Login Successful, Token received")

    # 3. Create MoM
    print("\n--- Testing MoM CRUD ---")
    mom_payload = {
        "title": "Weekly Sync",
        "meeting_date": "2023-10-27",
        "content": "Discussed Q4 roadmap and quarterly goals."
    }
    response = requests.post(f"{BASE_URL}/mom/", json=mom_payload, headers=headers)
    if response.status_code == 200:
        mom_id = response.json()["id"]
        log(f"Create MoM Successful (ID: {mom_id})")
    else:
        log(f"Create MoM Failed: {response.text}", False)
        return

    # 4. List MoMs
    response = requests.get(f"{BASE_URL}/mom/", headers=headers)
    if response.status_code == 200 and len(response.json()) > 0:
        log(f"List MoMs Successful (Count: {len(response.json())})")
    else:
        log(f"List MoMs Failed or Empty: {response.text}", False)

    # 5. Get MoM Detail
    response = requests.get(f"{BASE_URL}/mom/{mom_id}", headers=headers)
    if response.status_code == 200:
        log("Get MoM Detail Successful")
    else:
        log(f"Get MoM Detail Failed: {response.text}", False)

    # 6. Delete MoM
    response = requests.delete(f"{BASE_URL}/mom/{mom_id}", headers=headers)
    if response.status_code == 200:
        log("Delete MoM Successful")
    else:
        log(f"Delete MoM Failed: {response.text}", False)

if __name__ == "__main__":
    try:
        test_backend()
    except requests.exceptions.ConnectionError:
        log("Could not connect to backend. Is it running?", False)
