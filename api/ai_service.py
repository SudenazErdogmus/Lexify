# api/ai_service.py
import re
import json
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:3b"

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


def _ollama_json_cagir(prompt: str, timeout: int = 20):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2,
        },
    }
    res = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
    res.raise_for_status()
    raw_text = res.json().get("response", "").strip()
    return json.loads(raw_text)


def ollama_kelime_analiz_et(kelime: str, baglam: str = "") -> dict | None:
    """
    Tek bir kelimenin verildiği cümledeki bağlamına göre
    doğal Türkçe karşılığını, İngilizce tanımını ve örnek cümlesini üretir.
    """
    prompt = f"""
You are an expert English-Turkish dictionary assistant.
Analyze the English word "{kelime}" in the context of this sentence:
"{baglam}"

Return ONLY a valid JSON object with these exact keys:
- "turkce_ceviri": Short, natural Turkish translation matching the context (1-4 words).
- "ingilizce_tanim": Simple, clear English definition (1 short sentence).
- "ornek_cumle": One short, natural English example sentence using "{kelime}".
"""
    try:
        data = _ollama_json_cagir(prompt, timeout=45)
        if isinstance(data, dict) and data.get("turkce_ceviri"):
            return {
                "turkce_ceviri": str(data.get("turkce_ceviri", "")).strip(),
                "ingilizce_tanim": str(data.get("ingilizce_tanim", "")).strip(),
                "ornek_cumle": str(data.get("ornek_cumle", "")).strip(),
            }
    except Exception as e:
        print(f"⚠️ Ollama kelime analizi hatası ({kelime}): {e}")
    return None


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


def metni_analiz_et(metin, kullanici_seviyesi="B1"):
    print(f"🚀 Ollama analiz başladı. Seviye: {kullanici_seviyesi}, Metin uzunluğu: {len(metin)}")

    prompt = f"""
You are an expert English teacher for Turkish students.
Analyze the text below for a student at CEFR level {kullanici_seviyesi}.
Find up to 6 difficult words ABOVE {kullanici_seviyesi} (e.g. B2, C1, C2).

Return ONLY a JSON object with a single key "words" containing a list of objects, each with:
- "kelime": the English word
- "baglam": the exact sentence from the text where it appears
- "ingilizce_tanim": simple English definition
- "turkce_ceviri": natural Turkish translation in that context

Text:
{metin[:2500]}
"""
    try:
        data = _ollama_json_cagir(prompt, timeout=25)
        kelimeler = data.get("words", []) if isinstance(data, dict) else data
        if isinstance(kelimeler, list) and kelimeler:
            print(f"✅ Ollama'dan {len(kelimeler)} kelime alındı!")
            return {"basarili": True, "veri": kelimeler}
    except Exception as e:
        print(f"⚠️ Ollama hatası ({e}), yerel yedek analiz devreye alındı.")

    return {"basarili": True, "veri": yedek_analiz_et(metin)}