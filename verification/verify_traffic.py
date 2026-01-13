
from playwright.sync_api import sync_playwright

def verify_scenes(page):
    # 1. Start at MainMenu and click to start (expect Territory)
    page.goto("http://localhost:8081")

    # Wait for canvas
    page.wait_for_selector("canvas")

    # Click to start (Main Menu -> Territory)
    page.mouse.click(512, 384)
    page.wait_for_timeout(1000) # Wait for fade/transition

    # Check for Territory text (Macro World)
    page.screenshot(path="verification/01_territory.png")

    # Click "To Sanctuary" button (approx 900, 600)
    page.mouse.click(900, 600)
    page.wait_for_timeout(1000)

    # Check for Sanctuary text (Micro World) and Ink/Letters
    page.screenshot(path="verification/02_sanctuary.png")

    # Click "To Territory" button (approx 900, 600)
    page.mouse.click(900, 600)
    page.wait_for_timeout(1000)

    # Check return to Territory
    page.screenshot(path="verification/03_return_territory.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_scenes(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
