import os
import sys

from sarvamai import SarvamAI

key = os.environ.get("SARVAM_API_KEY", "").strip()
if not key:
    sys.exit("SARVAM_API_KEY is missing. Paste it into .env, then run this script again.")

client = SarvamAI(api_subscription_key=key)
response = client.chat.completions(
    model="sarvam-105b-conversations",
    messages=[{"role": "user", "content": "What is the capital of India?"}],
)
print(response.choices[0].message.content)
