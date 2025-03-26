import json
import logging
import os
import nltk
import numpy as np
import string
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Load configuration
with open("./config.json", "r") as config_file:
    config = json.load(config_file)

# Initialize logging
logging.basicConfig(
    filename=config["settings"]["log_file"],
    level=logging.INFO,
    format="%(asctime)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Download NLTK data
nltk.download('punkt')
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('stopwords')

# Initialize lemmatizer and stopwords
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

class ChatBot:
    def __init__(self):
        self.responses = config["responses"]
        self.similarity_threshold = config["settings"]["similarity_threshold"]
        self.vectorizer = TfidfVectorizer()

    def preprocess(self, text):
        """Preprocess the input text."""
        tokens = nltk.word_tokenize(text.lower())
        tokens = [lemmatizer.lemmatize(token) for token in tokens if token not in stop_words and token not in string.punctuation]
        return tokens

    def get_response(self, user_input):
        """Generate a response based on user input."""
        try:
            # Preprocess the user input
            tokens = self.preprocess(user_input)
            processed_input = " ".join(tokens)

            # Calculate TF-IDF vectors
            corpus = list(self.responses.keys()) + [processed_input]
            tfidf = self.vectorizer.fit_transform(corpus)

            # Calculate cosine similarity
            similarities = cosine_similarity(tfidf[-1], tfidf[:-1])
            best_match_index = np.argmax(similarities)

            # Get the best response
            if similarities[0][best_match_index] > self.similarity_threshold:
                return list(self.responses.values())[best_match_index]
            else:
                return self.responses["default"]
        except Exception as e:
            logging.error(f"Error generating response: {e}")
            return "Oops! Something went wrong. Please try again."

    def log_interaction(self, user_input, response):
        """Log user interactions."""
        logging.info(f"User: {user_input} | ChatBot: {response}")

    def start(self):
        """Start the chatbot interaction."""
        print("Chatbot: Hi! I'm your professional AI chatbot. Type 'bye' to exit.")
        while True:
            user_input = input("You: ")
            if user_input.lower() in ["bye", "exit", "quit"]:
                print("Chatbot: Goodbye! Take care!")
                break
            response = self.get_response(user_input)
            print(f"Chatbot: {response}")
            self.log_interaction(user_input, response)

# Run the chatbot
if __name__ == "__main__":
    chatbot = ChatBot()
    chatbot.start()