import os
import re
import requests
from flask import Flask, render_template, request, redirect, url_for, jsonify
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
MAX_INPUT_LENGTH = 10000  # Character limit

def build_prompt(user_text: str, length_choice: str, mode: str = 'paragraph') -> str:
    """
    Builds a prompt string guiding the model to produce summaries in different formats.
    
    Args:
        user_text: The text to summarize
        length_choice: '1' (short), '2' (medium), '3' (long)
        mode: 'paragraph', 'bullets', or 'takeaways'
    """
    # Length instructions
    if length_choice == '1':  # short
        length_instructions = "Provide a BRIEF summary (2-3 sentences)."
    elif length_choice == '3':  # long
        length_instructions = "Provide a DETAILED summary with multiple paragraphs."
    else:  # '2' => medium
        length_instructions = "Provide a MODERATE-LENGTH summary (one paragraph)."
    
    # Mode instructions
    if mode == 'bullets':
        format_instructions = (
            "Format your response as bullet points (use • or -). "
            "Each bullet should capture a key point from the text."
        )
    elif mode == 'takeaways':
        format_instructions = (
            "Provide KEY TAKEAWAYS numbered 1, 2, 3, etc. "
            "Focus on the most important insights and actionable points."
        )
    else:  # paragraph
        format_instructions = "Write the summary in clear, flowing paragraph form."
    
    final_prompt = (
        f"{length_instructions} {format_instructions}\n\n"
        "Important: Only include information explicitly stated in the text. "
        "Do not add facts, interpretations, or details not present in the original.\n"
        "If anything is unclear, omit it rather than fabricating information.\n\n"
        "Text to summarize:\n\n"
        f"{user_text}"
    )
    return final_prompt

def call_gemini_api(prompt_text: str) -> dict:
    """
    Calls the Google Gemini API and returns the result.
    
    Returns:
        dict with 'success' (bool), 'text' (str), and optional 'error' (str)
    """
    if not GOOGLE_API_KEY:
        return {
            'success': False,
            'text': '',
            'error': 'API key not configured. Please add GOOGLE_API_KEY to your .env file.'
        }
    
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={GOOGLE_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": prompt_text}]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048,
        }
    }
    
    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        data = response.json()
        
        if response.status_code == 200:
            try:
                summarized_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {'success': True, 'text': summarized_text}
            except (KeyError, IndexError) as e:
                return {
                    'success': False,
                    'text': '',
                    'error': f'Unexpected API response format: {str(e)}'
                }
        else:
            error_msg = data.get('error', {}).get('message', response.text)
            return {
                'success': False,
                'text': '',
                'error': f'API Error (HTTP {response.status_code}): {error_msg}'
            }
    except requests.Timeout:
        return {
            'success': False,
            'text': '',
            'error': 'Request timed out. Please try again.'
        }
    except Exception as e:
        return {
            'success': False,
            'text': '',
            'error': f'Exception: {str(e)}'
        }

def count_words(text: str) -> int:
    """Count words in text."""
    return len(re.findall(r'\w+', text))

def count_sentences(text: str) -> int:
    """Count sentences in text."""
    return len(re.findall(r'[.!?]+', text))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    user_text = request.form.get('user_text', '').strip()
    length_choice = request.form.get('length', '2')
    mode = request.form.get('mode', 'paragraph')
    
    # Validation
    if not user_text:
        return render_template('index.html', error='Please enter some text to summarize.')
    
    if len(user_text) > MAX_INPUT_LENGTH:
        return render_template(
            'index.html',
            error=f'Text is too long. Maximum {MAX_INPUT_LENGTH} characters allowed.'
        )
    
    # Input statistics
    input_word_count = count_words(user_text)
    input_sentence_count = count_sentences(user_text)
    input_char_count = len(user_text)
    
    # Build prompt and call API
    prompt = build_prompt(user_text, length_choice, mode)
    result = call_gemini_api(prompt)
    
    if not result['success']:
        return render_template(
            'index.html',
            error=result['error'],
            user_text=user_text,
            input_word_count=input_word_count,
            input_sentence_count=input_sentence_count,
            input_char_count=input_char_count
        )
    
    summarized_text = result['text']
    summary_word_count = count_words(summarized_text)
    summary_sentence_count = count_sentences(summarized_text)
    summary_char_count = len(summarized_text)
    
    return render_template(
        'index.html',
        summarized_text=summarized_text,
        summary_word_count=summary_word_count,
        summary_sentence_count=summary_sentence_count,
        summary_char_count=summary_char_count,
        input_word_count=input_word_count,
        input_sentence_count=input_sentence_count,
        input_char_count=input_char_count,
        user_text=user_text,
        selected_length=length_choice,
        selected_mode=mode
    )

@app.route('/api/wordcount', methods=['POST'])
def api_wordcount():
    """API endpoint for real-time word count."""
    text = request.json.get('text', '')
    return jsonify({
        'words': count_words(text),
        'characters': len(text),
        'sentences': count_sentences(text)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)