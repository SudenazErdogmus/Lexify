import csv
import os
import nltk
from django.conf import settings
from django.core.management.base import BaseCommand
from api.models import CEFRWord

NUM_TO_CEFR = {
    1: "A1",
    2: "A2",
    3: "B1",
    4: "B2",
    5: "C1",
    6: "C2",
}


class Command(BaseCommand):
    help = "words.csv ve word_pos.csv dosyalarını birleştirip CEFRWord tablosunu doldurur."

    def handle(self, *args, **kwargs):
        nltk.download("wordnet", quiet=True)
        nltk.download("omw-1.4", quiet=True)

        words_path = os.path.join(settings.BASE_DIR, "words.csv")
        pos_path = os.path.join(settings.BASE_DIR, "word_pos.csv")

        if not os.path.exists(words_path) or not os.path.exists(pos_path):
            self.stdout.write(
                self.style.ERROR(
                    "words.csv veya word_pos.csv bulunamadı! İki dosyayı da manage.py yanına koyun."
                )
            )
            return

        # 1) words.csv -> word_id: word eşleştirmesi
        self.stdout.write("1) words.csv okunuyor...")
        id_to_word = {}
        with open(words_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) < 2:
                    continue
                wid = row[0].strip()
                word = row[1].strip().lower()
                # Sadece harflerden oluşan geçerli kelimeleri al
                if wid.isdigit() and word.isalpha() and len(word) >= 2:
                    id_to_word[wid] = word

        # 2) word_pos.csv -> word_id üzerinden seviyeleri eşleştir
        self.stdout.write("2) word_pos.csv okunuyor ve seviyeler eşleştiriliyor...")
        word_levels = {}
        with open(pos_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                wid = (row.get("word_id") or "").strip()
                raw_level = (row.get("level") or "").strip()
                if wid not in id_to_word or not raw_level:
                    continue

                try:
                    lvl_num = int(round(float(raw_level)))
                except ValueError:
                    continue

                lvl_num = max(1, min(6, lvl_num))
                word = id_to_word[wid]

                # Aynı kelimenin birden fazla türü varsa en yaygın (düşük) seviyesini tut
                if word not in word_levels or lvl_num < word_levels[word]:
                    word_levels[word] = lvl_num

        # 3) Mevcut kelimeleri atlayıp yenileri topluca (batch) veritabanına yaz
        self.stdout.write("3) Veritabanına yazılıyor...")
        existing = set(CEFRWord.objects.values_list("word", flat=True))
        objects_to_create = [
            CEFRWord(word=w, cefr_level=NUM_TO_CEFR[lvl])
            for w, lvl in word_levels.items()
            if w not in existing
        ]

        CEFRWord.objects.bulk_create(objects_to_create, batch_size=2000, ignore_conflicts=True)

        self.stdout.write(
            self.style.SUCCESS(
                f"Tamamlandı! {len(objects_to_create)} yeni kelime eklendi. Toplam CEFRWord: {CEFRWord.objects.count()}"
            )
        )