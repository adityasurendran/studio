# Studio

## Curriculum Info Fetching Setup

To enable live curriculum info fetching for lesson generation, set the following environment variables in your `.env` file:

```
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_custom_search_engine_id_here
```

- Get your Google API key from https://console.cloud.google.com/apis/credentials
- Set up a Custom Search Engine at https://cse.google.com/cse/all and get the CSE ID
- Make sure the Custom Search API is enabled for your project

If these are not set, the app will use general knowledge as a fallback for curriculum info.

---

# Studio Project
