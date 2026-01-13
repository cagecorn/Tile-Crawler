
from playwright.sync_api import sync_playwright
import time

def verify_sanctuary():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        # Navigate to the game (Port 8080)
        page.goto("http://localhost:8080")

        # Wait a bit longer for loading
        time.sleep(10)

        # Take a screenshot
        page.screenshot(path="verification/sanctuary_debug.png")
        print("Screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_sanctuary()
