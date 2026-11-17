# api/utils.py
from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi
import trafilatura

def youtube_video_id_cikar(url):
    query = urlparse(url)
    if query.hostname == 'youtu.be':
        return query.path[1:]
    if query.hostname in ('www.youtube.com', 'youtube.com'):
        if query.path == '/watch':
            p = parse_qs(query.query)
            return p['v'][0]
        if query.path[:7] == '/embed/':
            return query.path.split('/')[2]
        if query.path[:3] == '/v/':
            return query.path.split('/')[2]
    return None

def youtube_metni_cek(url, diller=['en', 'tr']):
    video_id = youtube_video_id_cikar(url)
    if not video_id:
        return {"basarili": False, "hata": "Geçersiz YouTube linki."}
    
    try:
        # Yeni sürümde önce bir API nesnesi oluşturuluyor
        ytt_api = YouTubeTranscriptApi()
        # fetch() metodu doğrudan video_id ve dil listesi alıyor
        fetched_transcript = ytt_api.fetch(video_id, languages=diller)
        
        # Dönen nesne artık bir liste değil, üzerinde gezinebileceğimiz bir obje
        tam_metin = " ".join([snippet.text.replace('\n', ' ') for snippet in fetched_transcript])
        
        return {"basarili": True, "metin": tam_metin}
    except Exception as e:
        return {"basarili": False, "hata": f"Altyazı çekilemedi: {str(e)}"}

def makale_metni_cek(url):
    try:
        indirilen_icerik = trafilatura.fetch_url(url)
        if indirilen_icerik:
            metin = trafilatura.extract(indirilen_icerik, include_comments=False, include_tables=False)
            if metin:
                return {"basarili": True, "metin": metin}
            return {"basarili": False, "hata": "Sitede ana metin bulunamadı."}
        return {"basarili": False, "hata": "Siteye ulaşılamadı."}
    except Exception as e:
        return {"basarili": False, "hata": f"Hata: {str(e)}"}

def icerik_cek(url):
    if "youtube.com" in url or "youtu.be" in url:
        return youtube_metni_cek(url)
    else:
        return makale_metni_cek(url)

# --- TEST KISMI ---
if __name__ == "__main__":
    test_url = "https://www.youtube.com/watch?v=arj7oStGLkU" # İngilizce bir video
    print(f"Test ediliyor: {test_url}\n")
    
    sonuc = icerik_cek(test_url)
    if sonuc["basarili"]:
        print("✅ BAŞARILI! Çekilen Metin (İlk 300 karakter):")
        print(sonuc['metin'][:300] + "...")
    else:
        print(f"❌ HATA: {sonuc['hata']}")