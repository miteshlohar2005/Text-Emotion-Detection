# Emotion Detector 🥰😱😃😠😢

A simple web application that detects emotions from the text using LSTM and pre-trained GloVe embeddings.

## Installation

To use this web application, you need to follow these steps:

```bash
# Clone the repository to your local machine.
git clone https://github.com/Mr-Appu/Text-Based-Emotion-Recognition.git

# Activate the existing Python 3.10 environment on Windows.
.\venv310\Scripts\Activate.ps1

# Install the required dependencies.
pip install -r requirements.txt

# To run the app
python .\Flask\app.py

# Open the application
http://127.0.0.1:5000
```

## Features

* Login and Signup : You can create an account or login using your existing credentials.
* Emotion Detection : Once you have logged in, you can enter a text and the application will classify the emotions present in the text.
* Model Accuracy on Test-Data : 90.32

## Application

### Home Page 
![Home Page](Image/Home.png)

### Login Page
![Login Page](Image/Login.png)

### Classification
![Recognition](Image/model.png)
