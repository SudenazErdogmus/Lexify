# api/ai_service.py
import os
import re
import json
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY bulunamadı! .env dosyasını kontrol et.")

client = genai.Client(api_key=api_key)

YEDEK_SOZLUK = {
    "fundamentally": ("temelden, esaslı bir şekilde", "in a central or primary respect"),
    "reshaped": ("yeniden şekillendirdi", "shaped or formed differently again"),
    "fosters": ("teşvik eder, besler", "encourages the development of something"),
    "undermine": ("zayıflatmak, baltalamak", "to make someone or something weaker or less effective"),
    "thrive": ("gelişmek, serpilmek", "to grow, develop, or be successful"),
    "cultivate": ("geliştirmek, yetiştirmek", "to try to acquire or develop a quality or skill"),
    "deliberate": ("kasıtlı, bilinçli", "done consciously and intentionally"),
    "prioritize": ("öncelik vermek", "to designate or treat something as more important"),
    "comprehension": ("kavrama, anlama", "the ability to understand something"),
    "superficial": ("yüzeysel", "existing or occurring at or on the surface; not deep"),
    "ubiquitous": ("her yerde bulunan", "present, appearing, or found everywhere"),
    "paradigm": ("paradigma, model", "a typical example or pattern of something"),
}

def yedek_analiz_et(metin):
    cumleler = re.split(r'(?<=[.!?])\s+', metin.strip())
    bulunanlar = []
    eklenen_kelimeler = set()

    for cumle in cumleler:
        kelimeler = re.findall(r'\b[a-zA-Z]{6,}\b', cumle)
        for k in kelimeler:
            k_lower = k.lower()
            if k_lower in eklenen_kelimeler:
                continue
            if k_lower in YEDEK_SOZLUK:
                tr, en = YEDEK_SOZLUK[k_lower]
                bulunanlar.append({
                    "kelime": k_lower,
                    "baglam": cumle.strip(),
                    "ingilizce_tanim": en,
                    "turkce_ceviri": tr,
                })
                eklenen_kelimeler.add(k_lower)

    if not bulunanlar:
        for cumle in cumleler:
            kelimeler = re.findall(r'\b[a-zA-Z]{8,}\b', cumle)
            for k in kelimeler:
                k_lower = k.lower()
                if k_lower not in eklenen_kelimeler:
                    bulunanlar.append({
                        "kelime": k_lower,
                        "baglam": cumle.strip(),
                        "ingilizce_tanim": "Advanced vocabulary extracted from context.",
                        "turkce_ceviri": "Bağlamdan çıkarılan ileri seviye kelime",
                    })
                    eklenen_kelimeler.add(k_lower)
                if len(bulunanlar) >= 5:
                    break
            if len(bulunanlar) >= 5:
                break

    return bulunanlar[:6]

def _gemini_cagir(prompt):
    return client.models.generate_content(
        model='gemini-3.8-flash',
        contents=prompt,
    )

def metni_analiz_et(metin, kullanici_seviyesi="B1"):
    print(f"🚀 Analiz başladı. Seviye: {kullanici_seviyesi}, Metin uzunluğu: {len(metin)}")

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

    executor = ThreadPoolExecutor(max_workers=1)
    try:
        print("🤖 Gemini'ye istek gönderiliyor (6 sn kesin timeout)...")
        future = executor.submit(_gemini_cagir, prompt)
        response = future.result(timeout=6)

        yanit_metni = response.text.strip()
        print("✅ Gemini'den yanıt alındı!")

        if yanit_metni.startswith("```json"):
            yanit_metni = yanit_metni[7:-3].strip()
        elif yanit_metni.startswith("```"):
            yanit_metni = yanit_metni[3:-3].strip()

        kelimeler = json.loads(yanit_metni)
        return {"basarili": True, "veri": kelimeler}

    except TimeoutError:
        print("⏱️ Gemini 6 saniyede yanıt vermedi, yerel yedek analiz devreye alındı.")
    except Exception as e:
        print(f"⚠️ Gemini hatası ({e}), yerel yedek analiz devreye alındı.")
    finally:
        executor.shutdown(wait=False)

    return {"basarili": True, "veri": yedek_analiz_et(metin)}