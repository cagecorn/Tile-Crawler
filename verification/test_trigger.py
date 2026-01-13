
from playwright.sync_api import sync_playwright
import time

def verify_manual_trigger():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1024, 'height': 768})

        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        page.goto("http://localhost:8080")
        time.sleep(5)

        # Trigger logic manually via JS
        page.evaluate("window.sanctuaryScene.requestBook('poet')")
        print("Triggered requestBook('poet')")

        time.sleep(1)

        # Take screenshot
        page.screenshot(path="verification/sanctuary_triggered.png")
        print("Screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_manual_trigger()
