
from playwright.sync_api import sync_playwright
import time

def verify_interaction():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to match game config to minimize centering offset issues
        page = browser.new_page(viewport={'width': 1024, 'height': 768})

        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        page.goto("http://localhost:8080")
        time.sleep(5)

        # Click at 200, 185
        page.mouse.click(200, 185)
        print("Clicked at 200, 185")

        time.sleep(1)

        # Maybe the canvas is scaled down to fit?
        # If 1024x768 fits in 1024x768, it should be fine.

        # Take screenshot
        page.screenshot(path="verification/sanctuary_interaction_2.png")

        browser.close()

if __name__ == "__main__":
    verify_interaction()
