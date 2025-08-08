# app.py
from flask import Flask, request, jsonify, render_template
import tensorflow as tf
from tensorflow import keras
import numpy as np
from keras.models import load_model

# ... (your existing model loading and constants) ...
MODEL_PATH = 'best_model.keras'
EXPECTED_FEATURES = 7  # For Air Temp, Process Temp, Rot Speed, Torque, Tool Wear, Encoded Type (2 columns )
CLASS_NAMES = ['normal', 'failure']
app = Flask(__name__)

try:
    model = load_model("best_model.keras")
    print(f"Model loaded successfully from {MODEL_PATH}")
except Exception as e:
    print(f"Error loading model: {e}")

# New route to serve the HTML page
@app.route("/")
def index():
    return render_template("index.html") # Assumes index.html is in a 'templates' folder

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Check if request contains JSON data
        if not request.is_json:
            app.logger.error("Request does not contain JSON data. Headers: %s, Body: %s", request.headers, request.data)
            return jsonify({'error': 'Request must contain JSON data'}), 400

        data = request.get_json()
        app.logger.info("Received data: %s", data)  # Log the received JSON data

        # Validate required fields
        required_fields = ['air_temp', 'process_temp', 'rot_speed', 'torque', 'tool_wear', 'type']
        for field in required_fields:
            if field not in data:
                app.logger.error("Missing field in request: %s", field)
                return jsonify({'error': f'Missing field: {field}'}), 400

        # Extract and preprocess input data
        features = [
            float(data['air_temp']),
            float(data['process_temp']),
            float(data['rot_speed']),
            float(data['torque']),
            float(data['tool_wear'])
        ]
        # print("Got features")
        # Handle categorical variable 'type' (e.g., one-hot encoding)
        type_value = data['type']
        if type_value == 'L':
            features.extend([1.0, 0.0])  # One-hot encoding: Type_L=1, Type_M=0
        elif type_value == 'M':
            features.extend([0.0, 1.0])  # One-hot encoding: Type_L=0, Type_M=1
        elif type_value == 'H':
            features.extend([0.0, 0.0])  # This resembles type H for the one hot encoder
        else:
            # print("Wrong type")
            return jsonify({'error': 'Invalid type value.'}), 400

        # Convert to numpy array and reshape for model input
        input_array = np.array(features, dtype=np.float32)
        input_array = np.expand_dims(input_array, axis=0)  # Add batch dimension
        print('input array shape: ', input_array.shape[1])
        print(input_array)
        # Check if input shape matches model expectation
        if input_array.shape[1] != EXPECTED_FEATURES:
            return jsonify({'error': f'Expected {EXPECTED_FEATURES} features, got {input_array.shape[1]}'}), 400

        # Make prediction
        
        predictions_raw = model.predict(input_array)
        probabilities = predictions_raw[0]  # Get probabilities for the single input
        
        print('probs: ', probabilities)
        predicted_class_index = int(np.argmax(probabilities))
        confidence = float(np.max(probabilities))

        if predicted_class_index >= len(CLASS_NAMES):
            return jsonify({'error': f'Predicted class index {predicted_class_index} is out of bounds for CLASS_NAMES.'}), 500

        predicted_label = CLASS_NAMES[predicted_class_index]

        return jsonify({
            'prediction': predicted_label,
            'confidence': round(confidence, 4),
            'class_index': predicted_class_index,
        })

    except ValueError as ve:
        app.logger.error(f"Value error during prediction: {ve}")
        return jsonify({'error': f'Invalid input data: {str(ve)}'}), 400
    except Exception as e:
        app.logger.error(f"Error during prediction: {e}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({'error': f'An error occurred during prediction: {str(e)}'}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)