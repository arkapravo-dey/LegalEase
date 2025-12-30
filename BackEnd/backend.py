from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from langdetect import detect
from deep_translator import GoogleTranslator
from transformers import AutoModelForQuestionAnswering, AutoTokenizer, pipeline
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json
import os
import numpy as np

app = Flask(__name__)
CORS(app)

model_dir = "qa_model/kaggle/working/qa_model"
MODEL = SentenceTransformer(model_dir + "/sentence_transformer")
question_embeddings = np.load(model_dir + "/question_embeddings.npy")

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

@app.route('/api/<mode>', methods=['POST'])
def handle_request(mode):
    question = request.form.get('question') if mode == 'document' else request.json.get('question')
    if not question:
        return jsonify({"error": "No question provided"}), 400

    print(f"Received question ({mode.upper()} mode): {question}")

    if mode == 'qa':
        if len(question) > 15:
            language_code = detect(question)
        else:
            language_code = "en"
        
        translated_text = GoogleTranslator(source="auto", target="en").translate(question)
        user_embedding = MODEL.encode([translated_text], convert_to_tensor=True).cpu().numpy()
        similarities = cosine_similarity(user_embedding, question_embeddings)
        closest_idx = np.argmax(similarities)
        max_similarity = similarities[0][closest_idx]

        with open(model_dir + "/answers.json", "r") as f:
            answers = json.load(f)

        SIMILARITY_THRESHOLD = 0.7
        if max_similarity < SIMILARITY_THRESHOLD:
            final_answer = "I'm not sure I understand your question. Could you try rephrasing it?"
        else:
            ans = answers[closest_idx]
            final_answer = GoogleTranslator(source="auto", target=language_code).translate(ans)

        return jsonify({"answer": final_answer}), 200

    elif mode == 'search':
        def load_json(directory, filename):
            file_path = os.path.join(directory, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    return json.load(file)
            except FileNotFoundError:
                return None

        def search_case(json_data, case_id):
            if isinstance(json_data, list):
                for case in json_data:
                    if case.get("case_id") == case_id:
                        return case
            elif isinstance(json_data, dict):
                if json_data.get("case_id") == case_id:
                    return json_data
            return None

        data = load_json("Database", "Final.json")
        if not data:
            return jsonify({"error": "Database not found"}), 500

        case_id_to_search = request.json.get('question', '')
        result = search_case(data, case_id_to_search)

        if result:
            folder_name = case_id_to_search[:4]  
            case_filename = f"{case_id_to_search}.txt"
            case_filepath = os.path.join("Database", folder_name, case_filename)
            os.makedirs(os.path.dirname(case_filepath), exist_ok=True)

            with open(case_filepath, "w", encoding="utf-8") as file:
                json.dump(result, file, indent=4, ensure_ascii=False)

            return jsonify({
                "answer": result,
                "download_link": f"http://127.0.0.1:5000/download/{folder_name}/{case_filename}"
            }), 200

        return jsonify({"error": "Case not found"}), 404

    elif mode == 'document':
        uploaded_file = request.files.get('file')
        if not uploaded_file:
            return jsonify({"error": "No document uploaded"}), 400

        text = uploaded_file.read().decode('utf-8')

        max_input_length = 1024  
        if len(text) > max_input_length:
            text = text[:max_input_length]

        try:
            summary_result = summarizer(text, max_length=min(1024,len(text)), min_length=50, do_sample=False)
            summary = summary_result[0]["summary_text"]
            return jsonify({"answer": summary}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"answer": "HELLO"}), 200

@app.route('/download/<folder>/<filename>')
def download_file(folder, filename):
    directory = os.path.join("Database", filename[4:8])
    print(f"Serving file from: {directory}, Filename: {filename[4:]}")
    return send_from_directory(directory, filename[4:], as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)