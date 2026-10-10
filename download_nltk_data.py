import nltk
from pathlib import Path

data_dir = Path(__file__).resolve().parent / "nltk_data"
data_dir.mkdir(exist_ok=True)

nltk.download("punkt", download_dir=str(data_dir), quiet=False)
nltk.download("stopwords", download_dir=str(data_dir), quiet=False)
nltk.download("wordnet", download_dir=str(data_dir), quiet=False)
nltk.download("omw-1.4", download_dir=str(data_dir), quiet=False)

print("NLTK resources downloaded successfully.")