import os
import requests
from dotenv import load_dotenv

load_dotenv()

NOTION_VERSION = "2022-06-28"

def _get_headers():
    api_key = os.getenv("NOTION_API_KEY")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
    }

def get_or_create_database(user):
    # Kullanıcı için tablo daha önce oluşturulduysa direkt onu kullan
    if user.notion_database_id:
        return user.notion_database_id

    page_id = os.getenv("NOTION_PAGE_ID")
    if not page_id:
        raise ValueError("NOTION_PAGE_ID .env dosyasında bulunamadı.")

    url = "https://api.notion.com/v1/databases"
    payload = {
        "parent": {"type": "page_id", "page_id": page_id},
        "title": [
            {
                "type": "text",
                "text": {"content": "Lexify Sözlüğüm"}
            }
        ],
        "properties": {
            "Word": {"title": {}},
            "Translation": {"rich_text": {}},
            "Definition": {"rich_text": {}},
            "Context": {"rich_text": {}},
        },
    }

    response = requests.post(url, json=payload, headers=_get_headers(), timeout=10)
    if response.status_code != 200:
        raise Exception(f"Notion tablo oluşturma hatası: {response.text}")

    db_id = response.json()["id"]
    user.notion_database_id = db_id
    user.save(update_fields=["notion_database_id"])
    return db_id

def add_word_to_notion(user, word_obj):
    if not os.getenv("NOTION_API_KEY"):
        return False, "NOTION_API_KEY eksik."

    try:
        db_id = get_or_create_database(user)
        url = "https://api.notion.com/v1/pages"
        payload = {
            "parent": {"database_id": db_id},
            "properties": {
                "Word": {
                    "title": [{"text": {"content": word_obj.word}}]
                },
                "Translation": {
                    "rich_text": [{"text": {"content": word_obj.translation or ""}}]
                },
                "Definition": {
                    "rich_text": [{"text": {"content": word_obj.definition or ""}}]
                },
                "Context": {
                    "rich_text": [{"text": {"content": word_obj.context_sentence or ""}}]
                },
            },
        }

        response = requests.post(url, json=payload, headers=_get_headers(), timeout=10)
        if response.status_code == 200:
            word_obj.notion_page_id = response.json()["id"]
            word_obj.save(update_fields=["notion_page_id"])
            return True, "Notion'a eklendi."
        else:
            print(f"❌ Notion ekleme hatası: {response.text}")
            return False, response.text

    except Exception as e:
        print(f"❌ Notion bağlantı hatası: {str(e)}")
        return False, str(e)