from flask import Flask, jsonify, request
from flask_cors import CORS
from deepface import DeepFace
import cv2
import numpy as np
import urllib.request as ur

app = Flask(__name__)
CORS(app)

@app.route("/", methods=['POST'])

def root():
    try:
        data = request.get_json()

        link = data.get('link', '')

        req = ur.urlopen(link)
        arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
        img = cv2.imdecode(arr, -1) # 'Load it as it is'
        img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

        print("preprocessing done now analyzing")
        objs = DeepFace.analyze(img_path=img_bgr, actions=['age', 'gender', 'race', 'emotion'], enforce_detection=False)
        print("done analyzing")
        if objs:
            print("Dominant Emotion:", objs[0]['dominant_emotion'])
            return jsonify(objs[0]['dominant_emotion'])
        else:
            return jsonify({"error": "No analysis results found"})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(port=5003)
