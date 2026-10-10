import numpy as np
import pandas as pd
from pathlib import Path

import tensorflow as tf
from tensorflow import keras

import re
import pickle
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from keras.utils import pad_sequences

class Emotion_Detector():
    def __init__(self):
        model_dir = Path(__file__).resolve().parents[1] / "Model"
        model_path = model_dir / "lstm_model.h5"
        tokenizer_path = model_dir / "tokenizer.pickle"
        encoder_path = model_dir / "encoder.pickle"

        missing_files = [
            str(path)
            for path in (model_path, tokenizer_path, encoder_path)
            if not path.is_file()
        ]
        if missing_files:
            raise FileNotFoundError(
                "Emotion model files are missing: " + ", ".join(missing_files)
            )

        self.lstm_model = keras.models.load_model(model_path, compile=False)
        
        with tokenizer_path.open("rb") as handle:
            self.word_tokenizer = pickle.load(handle)
            
        with encoder_path.open("rb") as handle:
            self.encoder = pickle.load(handle)
    
    def text_preprocessing(self,text):
        # Remove punctuations and numbers
        text = re.sub("[^a-zA-Z]"," ",text.lower())
        text = re.sub(r"\s+",' ',text)
    
        # Tokenization
        token = word_tokenize(text)

        # Remove StopWords
        token = [i for i in token if i not in stopwords.words("english")]

        # Lemmatization
        lemmatizer = WordNetLemmatizer()
        token = [lemmatizer.lemmatize(word) for word in token]

        processed_text = " ".join(token)
        return processed_text
    
    def string_to_vector(self,text):
        max_len = 35
        text = self.text_preprocessing(text)
        vector = self.word_tokenizer.texts_to_sequences([text])
        padded_vector = pad_sequences(vector,padding="post",maxlen=max_len)

        return padded_vector
    
    def predict(self,text):
        vector = self.string_to_vector(text)
        out = self.lstm_model.predict(vector,verbose=0)

        answer = np.argmax(out)
        ans = self.encoder.inverse_transform([answer])

        ans_dict = {}
        for i in range(5):
            ans_dict[self.encoder.inverse_transform([i])[0]] = (out[0][i]/np.sum(out) * 100)

        return ans[0],ans_dict