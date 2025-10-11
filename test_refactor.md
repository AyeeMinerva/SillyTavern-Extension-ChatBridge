import asyncio
import aiohttp
import json
import uuid

async def send_request(session, url, data, headers):
    """Sends a single request and returns the response."""
    try:
        async with session.post(url, json=data, headers=headers) as response:
            return await response.json()
    except Exception as e:
        return {"error": str(e)}

async def main():
    """Main function to run the tests."""
    url = "http://127.0.0.1:5100/v1/chat/completions"
    # It is crucial to use a valid API key for authentication.
    # Please replace "your_api_key" with the actual key before running the test.
    headers = {"Authorization": "Bearer your_api_key"}

    # Test Case 1: Single Request
    print("--- Running TC-01: Single Request ---")
    single_request_data = {
        "messages": [{"role": "user", "content": "Hello, this is test 1"}],
        "model": "gpt-3.5-turbo"
    }
    async with aiohttp.ClientSession() as session:
        response = await send_request(session, url, single_request_data, headers)
        print(f"Response: {response}\n")

    # Test Case 2: Concurrent Requests
    print("--- Running TC-02: Concurrent Requests ---")
    concurrent_requests = [
        {
            "messages": [{"role": "user", "content": "Test A"}],
            "model": "gpt-3.5-turbo"
        },
        {
            "messages": [{"role": "user", "content": "Test B"}],
            "model": "gpt-3.5-turbo"
        },
        {
            "messages": [{"role": "user", "content": "Test C"}],
            "model": "gpt-3.5-turbo"
        }
    ]
    async with aiohttp.ClientSession() as session:
        tasks = [send_request(session, url, req, headers) for req in concurrent_requests]
        responses = await asyncio.gather(*tasks)
        for i, res in enumerate(responses):
            print(f"Response {i+1}: {res}")

if __name__ == "__main__":
    asyncio.run(main())