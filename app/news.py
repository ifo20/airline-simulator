from datetime import datetime, timedelta
import requests
from typing import List

# I googled "news api" and found this:
# https://newsapi.org/docs/endpoints/everything
base_url = "https://newsapi.org/v2/everything"

class Article:
    title: str
    author: str
    source: dict
    published_at: str # ISO timestamp
    url: str

def search_news(text, sortBy="popularity") -> List[Article]:
    from_date = datetime.today() - timedelta(days=28) # free version only lets us go ~1 month back
    url = base_url + f"?q={text}&from={from_date}&sortBy={sortBy}&apiKey=076226eaa3474815a7f1cd9471e9af1f"
    response = requests.get(url)
    return response.json()["articles"]
