# Building a Facial Recognition System from Scratch

Project developed at Machine Learning Specialist Training Bootcamp, under the guidance of specialist [Diego Renan](https://github.com/diegobrunoDIO "Diego Renan").

The primary objective of this project is to work with libraries and frameworks. Accordingly, the standard proposal entails a face detection and recognition system using the TensorFlow framework in conjunction with any libraries the developer deems appropriate.

Figure 1 illustrates the expected outcome for the proposed model, which must be capable of detecting and processing multiple faces simultaneously.  

To achieve this, you must:

1. Use a detection network trained to detect faces.
2. Use a classification network to classify the detected face.
![Figure 1](./docs/assets/image.png)
Figure 1: Face detection and recognition.

## Features

- Semantic HTML and ARIA attributes for accessibility.
- Responsive layout for desktop, tablet, and mobile.
- Dark / Light theme toggle (moon / sun icons). Dark is default.
- Language selector (EN-US, PT-BR, ES-ES).
- Image upload with drag & drop support and preview on a canvas.
- Placeholder for backend integration: expects a JSON response with detections.
- Minimal, easy-to-adapt code for local demos.

## Tecnologies used

- **Python**:
- **HTML**: main page (semantic structure).
- **CSS**: styles (dark-first, responsive).
- **JavaScript**: UI logic: theme, language, preview, demo detection simulation.

## How to use (local)

1. Open `index.html` in a browser (desktop or mobile).
2. Upload an image and click **Detect & Recognize** to see a simulated detection overlay.

## Integrating with your Python backend

If you already have the Python pipeline (FaceNet + MTCNN + SVM), adapt the frontend to call your backend endpoint. Example expectations:

- **Endpoint**: `POST /api/recognize`
- **Request**: `multipart/form-data` with field `image` (file)
- **Response** (JSON):

```json
{
  "detections": [
    { "box": [x, y, width, height], "name": "label", "confidence": 0.92 },
    ...
  ]
}
```

Update the onDetect() function in script.js to POST the image and parse the JSON response. The frontend expects coordinates in pixels relative to the original image size.

## Accessibility notes

- All interactive controls are keyboard accessible.
- Theme and language preferences are stored in localStorage.
- ARIA attributes and role landmarks are included for screen readers.

## Customization tips

- Replace the simulated detection in script.js with a real fetch to your backend.
- If your backend returns normalized coordinates (0–1), convert them to pixel coordinates before drawing.
- For production, serve the frontend from a static server and secure the backend endpoints.

[LICENSE](/LICENSE)
