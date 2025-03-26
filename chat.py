

from flask import Flask, request, jsonify
import openai
import os

app = Flask(__name__)

# Load API key from environment variables
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OpenAI API key is missing. Set OPENAI_API_KEY as an environment variable.")

client = openai.OpenAI(api_key=api_key)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    
    if not data or "message" not in data:
        return jsonify({"error": "Message field is required"}), 400

    user_message = data["message"]
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-16k",  # Make sure this model name is correct
            
            messages=[{"role": "user", "content": user_message}]
        )
        reply = response.choices[0].message.content
        return jsonify({"response": reply})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
