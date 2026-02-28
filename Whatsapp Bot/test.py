from openai import OpenAI

client = OpenAI(
    api_key="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",
    base_url="https://openrouter.ai/api/v1"
)

try:
    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",
        messages=[
            {"role": "user", "content": "Hello, test message"}
        ],
        max_tokens=100   # 👈 IMPORTANT
    )

    print("✅ API key is WORKING")
    print(response.choices[0].message.content)

except Exception as e:
    print("❌ API key NOT working")
    print(e)
