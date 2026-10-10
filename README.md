# Text Emotion Detection using LSTM and Flask

An AI-powered web application that analyzes text and predicts the emotion expressed in it using Natural Language Processing (NLP) and a Long Short-Term Memory (LSTM) neural network.

The application provides a simple, interactive interface where users can enter text and view the predicted emotion along with the model's confidence scores.

## Overview

Understanding emotions in written text is useful in sentiment analysis, customer feedback analysis, social media monitoring, and human-computer interaction.

This project uses a trained deep learning model to classify text into five emotion categories:

- 😊 Joy
- 😢 Sadness
- 😠 Anger
- ❤️ Love
- 😨 Fear

The application is built with Flask and allows users to access emotion prediction directly from the homepage without requiring login or registration.

## Features

- **Text Emotion Classification:** Predicts emotions from user-provided text.
- **Deep Learning Model:** Uses an LSTM-based neural network.
- **NLP Processing:** Uses text tokenization and sequence preprocessing.
- **Confidence Scores:** Displays the model's prediction confidence and emotion score breakdown.
- **Interactive Web Interface:** Provides a simple interface for entering and analyzing text.
- **Direct Access:** Users can make predictions without creating an account.
- **Input Validation:** Handles empty text submissions.
- **Responsive UI:** Dark-themed interface designed for a clear user experience.

## Tech Stack

| Technology | Purpose |
|---|---|
| Python | Core programming language |
| Flask | Web application framework |
| TensorFlow / Keras | Deep learning and model inference |
| LSTM | Emotion classification |
| NLP | Text preprocessing |
| HTML5 | Web page structure |
| CSS3 | Styling and responsive interface |
| NumPy | Numerical operations |

## Project Structure

```text
Text-Emotion-Detection/
├── Datasets/
├── Flask/
│   ├── app.py
│   ├── predict.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── login.html
│   │   └── predict.html
│   └── static/
│       └── css/
│           └── main.css
├── Image/
├── Model/
│   ├── lstm_model.h5
│   ├── encoder.pickle
│   └── tokenizer.pickle
├── My Sql/
├── Notebooks/
├── requirements.txt
├── .gitignore
└── README.md
```

*Note: The structure above is illustrative. Keep only the files and folders that actually exist in your repository.*

## Installation and Setup

### Prerequisites

- Python 3.10
- Git
- pip

### 1. Clone the repository

```bash
git clone https://github.com/miteshlohar2005/Text-Emotion-Detection.git
cd Text-Emotion-Detection
```

### 2. Create a virtual environment

**Windows PowerShell:**

```powershell
py -3.10 -m venv .venv
```

### 3. Activate the environment

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If dependency installation fails, check the Python version and the package versions specified in `requirements.txt`.

### 5. Verify model files

Ensure the trained model and preprocessing files are present in the expected locations:

- `Model/lstm_model.h5`
- `Model/encoder.pickle`
- `Model/tokenizer.pickle`

The model-loading paths in `Flask/predict.py` must match the actual file locations in your project.

### 6. Run the application

From the project root, execute:

```bash
python Flask/app.py
```

Open your browser and visit:

**http://127.0.0.1:5000**

## How to Use

1. Open the application in your browser.
2. Enter a sentence or paragraph in the text input field.
3. Click **Predict Emotion**.
4. View the predicted emotion.
5. Review the confidence score and emotion score breakdown.
6. Click **Clear** to analyze another text.

### Example

**Input:**

```text
I am very happy today.
```

**Expected output format:**

```text
Predicted Emotion: Joy
Model Confidence: Displayed by the application
```

*The actual prediction depends on the trained model and its output.*

## Model and Prediction Workflow

1. The user enters text through the Flask web interface.
2. Flask receives the input and passes it to the prediction module.
3. The text is processed using the saved tokenizer and the preprocessing steps expected by the trained model.
4. The LSTM model generates emotion scores.
5. The encoder and model output are used to identify the predicted emotion.
6. The application displays the result and confidence scores.

## Model Performance

The original project documentation reports a test-data accuracy of **90.32%**.

This figure is reported from the project's existing documentation and has not been independently re-evaluated as part of this README.

## Future Improvements

- Improve performance on complex sentences and mixed emotions.
- Add support for multilingual emotion detection.
- Provide a history of previous predictions.
- Improve accessibility and mobile responsiveness.
- Deploy the application to a cloud hosting platform.
- Add automated tests for prediction and input validation.

## Limitations

- Predictions depend on the training dataset and the quality of the trained model.
- The model may misclassify sarcasm, ambiguous text, or sentences expressing multiple emotions.
- Confidence scores indicate model confidence, not a guarantee that the prediction is correct.
- The application is intended for educational and demonstration purposes.

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch to your fork.
5. Open a pull request.

## License

No license has been specified yet. Add an appropriate `LICENSE` file before explicitly granting others permission to reuse or redistribute this project.

## Author

**Mitesh Lohar**

- GitHub: https://github.com/miteshlohar2005
- LinkedIn: https://www.linkedin.com/in/mitesh-ramesh-lohar/

---

If you find this project useful, consider giving the repository a star.
