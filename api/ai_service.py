# api/ai_service.py
import os
import json
import time
from google import genai
from dotenv import load_dotenv

# .env dosyasındaki API anahtarını yükle
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY bulunamadı! .env dosyasını kontrol et.")

# Yeni nesil istemciyi başlat
client = genai.Client(api_key=api_key)

def metni_analiz_et(metin, kullanici_seviyesi="B1"):
    prompt = f"""
    Sen uzman bir İngilizce öğretmenisin. Aşağıdaki metni, seviyesi {kullanici_seviyesi} olan bir öğrenci için analiz et.
    
    Görevin:
    1. Metindeki {kullanici_seviyesi} seviyesinin ÜZERİNDEKİ (örneğin B2, C1, C2) zor kelimeleri ve deyimleri bul.
    2. Her kelime için şu bilgileri çıkar:
       - "kelime": Bulduğun İngilizce kelime.
       - "baglam": Kelimenin metinde geçtiği TAM cümle.
       - "ingilizce_tanim": Kelimenin İngilizce sözlük anlamı (basit bir dille).
       - "turkce_ceviri": Kelimenin Türkçe karşılığı.
       
    Çıktıyı SADECE geçerli bir JSON dizisi (array) formatında ver. Başka hiçbir açıklama yazma.
    
    Metin:
    {metin[:4000]} 
    """

    # Sunucu yoğunluğuna karşı 3 kez deneme yapalım
    for deneme in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-3.8-flash',
                contents=prompt,
            )
            yanit_metni = response.text.strip()
            
            # JSON temizleme
            if yanit_metni.startswith("```json"):
                yanit_metni = yanit_metni[7:-3]
            elif yanit_metni.startswith("```"):
                yanit_metni = yanit_metni[3:-3]
                
            kelimeler = json.loads(yanit_metni)
            return {"basarili": True, "veri": kelimeler}
            
        except Exception as e:
            hata_mesaji = str(e)
            if "503" in hata_mesaji or "UNAVAILABLE" in hata_mesaji:
                print(f"⚠️ Sunucu yoğun, {deneme+1}. deneme başarısız. 3 saniye bekleniyor...")
                time.sleep(3)
            else:
                return {"basarili": False, "hata": hata_mesaji}

    return {"basarili": False, "hata": "Google sunucuları şu an çok yoğun. Lütfen 1-2 dakika sonra tekrar dene."}

# --- TEST KISMI ---
if __name__ == "__main__":
    print("Yapay Zeka test ediliyor, lütfen bekle...")
    
    test_metni = "The ubiquitous nature of technology has fundamentally altered our paradigm of communication."
    
    sonuc = metni_analiz_et(test_metni, "B1")
    
    if sonuc["basarili"]:
        print("\n✅ YAPAY ZEKA ANALİZİ BAŞARILI!")
        print(json.dumps(sonuc["veri"], indent=4, ensure_ascii=False))
    else:
        print(f"\n❌ HATA: {sonuc['hata']}")