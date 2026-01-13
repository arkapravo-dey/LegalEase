# Virtual Legal Assistant : LegalEase

## 📌 Project Overview

**LegalEase** is a web-based legal assistant that helps users:

- Ask legal questions and get AI-generated answers (Q/A mode)
- Search for relevant legal cases (Search Cases mode)
- Upload a document and get AI-generated responses based on its content (Document Answering mode)
- **Multilingual Support**!!! Not Comfortable with English, Dont Worry we got you with multilingual support in thousands of languages

The frontend is built with **HTML, JavaScript, and CSS**, while the backend is powered by **Flask, Sentence Transformers, Facebook Bart** for AI-driven responses.

## 🎥 Demo Video
- [**Demo Video**](https://drive.google.com/drive/folders/1RuB0dacip__IzGNaeMlvaVHR2uRSuwdV?usp=sharing) (GDrive Link)


## 📂 Project Structure

```plaintext
Vashisht-Hackathon/
│-- backend/                 # Flask Backend API
│   │-- backend.py               # Main Flask app
│   │-- requirements.txt     # Python dependencies
    │-- qa_model/kaggle/working/  #Fine Tuned Model along with vector embeddings
      |-- sentence_transformer/
      |-- answers.json
      |-- question_embeddings.npy
      |-- questions.json
    |-- Database.zip 
    |-- Final.json           #contains metadata of cases procured by preprocessing thousands of cases
    |-- Data.json              
│-- frontend/                # Frontend Code (HTML, CSS, JS)
│   │-- index.html           # Main UI
    │-- script.js            # Client-side JavaScript
    │-- styles.css           # Styling
│-- README.md                # Documentation
```

---

## 🔧 Technologies Used

### **Frontend**

- HTML, CSS, JavaScript
- Fetch API for sending requests to backend

### **Backend**

- Python (Flask for API)
- Sentence Transformers (`all-MiniLM-L6-v2`)
- BART Model for RAG(Retrieval-Augmented Generation) tasks (`facebook/bart-large-cnn`)
- Google Translator API (for multilingual support)
- Sklearn (Cosine Similarity for question matching)
- Thresholding for prevention of garbage values.
- Numpy & JSON for data handling
- Using **Regex** and **NLP** for creating and curating a custom dataset that acts as an header to the original Database
- Using **Torch** and **Sentence Transformers** a fine tuned model was created with embeddings saved in qa_model for fast fetching 
- The Transformers Model was trained over the Question Answer Pipeline for over 5 epochs and the resulting model was saved for faster fetching of embedding vectors.

---

## 🚀 Getting Started

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/arkapravo-dey/LegalEase
cd LegalEase
```
### **2️⃣ Extract Database.zip**
```bash
tar -xf "backend\Database.zip" -C "backend"
```

### **3️⃣ Setup Backend (Flask API)**

#### **🔹 Install Python Dependencies**

Make sure you have Python installed, then run:

```bash
cd backend
python -m venv env1   # Create a virtual environment
source env1/bin/activate  # (For macOS/Linux)
env1\Scripts\activate  # (For Windows)
pip install -r requirements.txt  # Install dependencies
```


#### **🔹 Start the Flask Server**

```bash
python backend.py
```

The API will start at `http://127.0.0.1:5000`

### **4️⃣ Setup Frontend**

No Hassle with React No TS no Tailwind No dependencies required! Just open `frontend/index.html` in a browser.


---

## ⚙️ API Endpoints

### **1️⃣ Q/A Mode** (Ask legal questions)

```http
POST /api/qa
```

**Request Body:**

```json
{
  "question": "What are the rights of citizenship for certain persons of Indian origin residing outside India?"
}
```

**Response:**

```json
{
  "answer": "Any person who or either of whose parents or any of whose grand-parents was born in India as defined in the Government of India Act, 1935, and who is ordinarily residing in any country outside India as so defined shall be deemed to be a citizen of India if he has been registered as a citizen of India by the diplomatic or consular representative of India in the country where he is residing."
}
```

### **2️⃣ Search Cases Mode** (Legal case search)

```http
POST /api/search
```

Similar to Q/A mode but searches in legal case data.
- This feature was implemented by using data reduction from case_files to Header by using NLP and regex model to extract usable data; 
- Then binary search is performed on the names of the cases. The output is the metadata of that particular case and follwed by it is a download case button; 
- Which will serve the actual case file as dictated by the presiding Judge. 

### **3️⃣ Document Answering Mode** (Upload document & get answers)

```http
POST /api/document
```

**Request Body:** FormData with request as a `file`. 
- The backend uses a finetuned Facebook Bart model to summarize the given document;
- Saving the hassle to go through thousands of lines of case files

---

## 📌 How it Works

1. User selects a mode (`Q/A`, `Search Cases`, or `Document Answering`).
2. Inputs a legal query or uploads a document.
3. The frontend sends a request to the backend.
4. The backend processes the request using **Sentence Transformers** and **Cosine Similarity**.
5. Response is sent back to the frontend and displayed to the user.

---

## 🛠 Future Enhancements

- Improve response accuracy using **fine-tuned legal datasets**.
- Add **OCR support** for extracting text from images.
- Integrate **speech-to-text** for voice-based input.
- Add a functionality to understand the context of Users Case and go through millions of Cases and suggest a better outcome

---

## 🤝 Contributing

Feel free to submit **issues** or **pull requests** to improve this project!

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 📧 Contact

For queries, reach out at [**arka2005dey@gmail.com**](mailto\:arka2005dey@gmail.com) or open an issue on GitHub!
