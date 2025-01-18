import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from mtcnn import MTCNN  # Library untuk deteksi wajah

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Path to the saved model
MODEL_PATH = './models/human_expression_model.h5'
model = load_model(MODEL_PATH)

# Allowed image extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Path to store uploaded images
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Emotion labels
class_labels = ['Marah', 'Netral', 'Sedih', 'Senyum', 'Terkejut']

# Initialize MTCNN
face_detector = MTCNN()

# Helper function to check allowed file types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function for face detection and preprocessing
def detect_and_preprocess_face(image_path, target_size=(224, 224)):
    # Load image
    img = cv2.imread(image_path)
    if img is None:
        return None, 'Invalid image or unreadable file'

    # Detect face using MTCNN
    detected_faces = face_detector.detect_faces(img)

    if detected_faces:
        # Get the first detected face
        x, y, w, h = detected_faces[0]['box']

        # Add padding to the bounding box
        padding = 20
        x = max(x - padding, 0)
        y = max(y - padding, 0)
        w = min(w + 2 * padding, img.shape[1] - x)
        h = min(h + 2 * padding, img.shape[0] - y)
        
        face = img[y:y+h, x:x+w]
    else:
        # Fallback: use the central region of the image
        height, width = img.shape[:2]
        center_x, center_y = width // 2, height // 2
        half_size = min(center_x, center_y)
        face = img[center_y - half_size:center_y + half_size, center_x - half_size:center_x + half_size]

    # Resize and normalize the face image
    face_resized = cv2.resize(face, target_size)
    face_normalized = face_resized.astype('float32') / 255.0
    face_expanded = np.expand_dims(face_normalized, axis=0)

    return face_expanded, None

# Route for handling image upload and prediction
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Preprocess the uploaded image
        face_image, error_message = detect_and_preprocess_face(filepath)
        if face_image is None:
            return jsonify({'error': error_message})

        # Predict emotion
        prediction = model.predict(face_image)
        predicted_class_index = np.argmax(prediction, axis=1)[0]
        predicted_class = class_labels[predicted_class_index]

        return jsonify({'prediction': predicted_class})

    return jsonify({'error': 'Invalid file format'})

if __name__ == '__main__':
    app.run(debug=True)
