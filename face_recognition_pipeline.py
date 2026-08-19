import os
import cv2
import numpy as np
from mtcnn import MTCNN
from sklearn.preprocessing import LabelEncoder, Normalizer
from sklearn.svm import SVC
import joblib
from keras_facenet import FaceNet

# -----------------------
# Configuration
# -----------------------
DATASET_DIR = "dataset"                # folder with subfolders per person
EMBEDDINGS_FILE = "embeddings.npz"
CLASSIFIER_FILE = "svm_classifier.joblib"
LABEL_ENCODER_FILE = "label_encoder.joblib"
FACENET_MODEL = FaceNet()              # loads FaceNet (keras-facenet)
DETECTOR = MTCNN()                     # MTCNN detector (uses TensorFlow under the hood)
IMG_SIZE = (160, 160)                  # size expected by FaceNet

# -----------------------
# Utility functions
# -----------------------
def extract_face(img, box, required_size=IMG_SIZE):
    """
    Crop a face from the image using the bounding box and resize to required_size.
    box is [x, y, width, height] as returned by MTCNN.
    Returns an RGB face image or None if cropping fails.
    """
    x1, y1, width, height = box
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = x1 + width, y1 + height
    face = img[y1:y2, x1:x2]
    if face.size == 0:
        return None
    face = cv2.resize(face, required_size)
    face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
    return face

def load_dataset(dataset_dir):
    """
    Walks the dataset directory where each subfolder is a person label.
    Detects the largest face in each image and returns arrays of face images and labels.
    """
    X, y = [], []
    for person_name in os.listdir(dataset_dir):
        person_dir = os.path.join(dataset_dir, person_name)
        if not os.path.isdir(person_dir):
            continue
        for filename in os.listdir(person_dir):
            path = os.path.join(person_dir, filename)
            img = cv2.imread(path)
            if img is None:
                continue
            detections = DETECTOR.detect_faces(img)
            if len(detections) == 0:
                continue
            # use the largest detected face
            detections = sorted(detections, key=lambda d: d['box'][2] * d['box'][3], reverse=True)
            face = extract_face(img, detections[0]['box'])
            if face is None:
                continue
            X.append(face)
            y.append(person_name)
    return np.array(X), np.array(y)

def get_embeddings(facenet_model, faces):
    """
    Given an array of RGB faces (160x160), return L2-normalized embeddings.
    """
    embeddings = facenet_model.embeddings(faces)
    normalizer = Normalizer(norm='l2')
    embeddings = normalizer.transform(embeddings)
    return embeddings

# -----------------------
# Training
# -----------------------
def train(dataset_dir=DATASET_DIR):
    print("Loading dataset...")
    faces, labels = load_dataset(dataset_dir)
    if len(faces) == 0:
        raise ValueError("No faces found in the dataset. Check folder structure and images.")
    print(f"Faces loaded: {len(faces)}")

    print("Extracting embeddings with FaceNet...")
    embeddings = get_embeddings(FACENET_MODEL, faces)

    # encode labels
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(labels)

    # train SVM with probability estimates to obtain confidence scores
    print("Training SVM classifier...")
    model = SVC(kernel='linear', probability=True)
    model.fit(embeddings, y)

    # save artifacts
    joblib.dump(model, CLASSIFIER_FILE)
    joblib.dump(label_encoder, LABEL_ENCODER_FILE)
    np.savez(EMBEDDINGS_FILE, embeddings=embeddings, labels=labels)
    print("Training finished. Models saved.")

# -----------------------
# Inference on a single image
# -----------------------
def recognize_image(input_image_path, output_image_path):
    """
    Detect faces in the input image, predict identity for each detected face,
    draw blue rectangles and labels with confidence, and save the output image.
    """
    # load trained models
    if not os.path.exists(CLASSIFIER_FILE) or not os.path.exists(LABEL_ENCODER_FILE):
        raise FileNotFoundError("Classifier or label encoder not found. Run train() first.")

    model = joblib.load(CLASSIFIER_FILE)
    label_encoder = joblib.load(LABEL_ENCODER_FILE)

    img = cv2.imread(input_image_path)
    if img is None:
        raise FileNotFoundError(f"Input image not found: {input_image_path}")

    detections = DETECTOR.detect_faces(img)
    for det in detections:
        box = det['box']  # [x, y, width, height]
        face = extract_face(img, box)
        if face is None:
            continue
        # extract embedding
        emb = get_embeddings(FACENET_MODEL, np.expand_dims(face, axis=0))
        # predict
        probs = model.predict_proba(emb)[0]
        idx = np.argmax(probs)
        confidence = probs[idx]
        name = label_encoder.inverse_transform([idx])[0]

        # draw blue rectangle and label
        x, y, w, h = box
        x, y = max(0, x), max(0, y)
        cv2.rectangle(img, (x, y), (x + w, y + h), (255, 0, 0), 2)  # blue in BGR
        label_text = f"{name} ({confidence:.2f})"
        # background for text
        (text_w, text_h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
        cv2.rectangle(img, (x, y - text_h - 8), (x + text_w + 6, y), (255, 0, 0), -1)
        cv2.putText(img, label_text, (x + 3, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)

    # save output image
    cv2.imwrite(output_image_path, img)
    print(f"Processed image saved to {output_image_path}")

# -----------------------
# Example usage
# -----------------------
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Face detection and recognition")
    parser.add_argument("--mode", choices=["train", "recognize"], required=True)
    parser.add_argument("--input", help="Path to input image for recognition")
    parser.add_argument("--output", help="Path to save the output image")
    parser.add_argument("--dataset", help="Dataset folder for training")
    args = parser.parse_args()

    if args.dataset:
        DATASET_DIR = args.dataset

    if args.mode == "train":
        train(DATASET_DIR)
    elif args.mode == "recognize":
        if not args.input or not args.output:
            raise ValueError("For recognize mode, specify --input and --output")
        recognize_image(args.input, args.output)
