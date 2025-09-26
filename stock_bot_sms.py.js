import asyncio
from playwright.async_api import async_playwright
from twilio.rest import Client
import os

# --------------------------
# CONFIG
# --------------------------
PRODUCT_URL = "https://www.pokemoncenter.com/product/10-10186-109/pokemon-tcg-mega-evolution-phantasmal-flames-pokemon-center-elite-trainer-box"
CHECK_INTERVAL = 30  # seconds

# Twilio settings (from Render Environment Variables)
TWILIO_SID = os.getenv("TWILIO_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE")
YOUR_PHONE = os.getenv("YOUR_PHONE")


def send_sms():
    """Send stock alert SMS"""
    client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)
    message = client.messages.create(
        body=f"✅ Pokémon Center item IN STOCK! Go now: {PRODUCT_URL}",
        from_=TWILIO_PHONE,
        to=YOUR_PHONE
    )
    print("📲 SMS sent:", message.sid)


async def check_stock(page):
    """Check if the product is available"""
    await page.goto(PRODUCT_URL, timeout=60000)
    await page.wait_for_timeout(3000)  # wait for JS to load
    content = await page.content()

    if "Add to Cart" in content or "In Stock" in content:
        return True
    return False


async def job():
    """Main loop"""
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()

        while True:
            try:
                in_stock = await check_stock(page)
                if in_stock:
                    print("🟢 Item in stock! Sending SMS...")
                    send_sms()
                    break
                else:
                    print("🔴 Still out of stock...")
            except Exception as e:
                print("⚠️ Error:", e)

            await asyncio.sleep(CHECK_INTERVAL)

        await browser.close()


if __name__ == "__main__":
    asyncio.run(job())
