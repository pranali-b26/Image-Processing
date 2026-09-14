from flask import Flask, request, jsonify, send_from_directory

from PIL import Image
import numpy as np
from scipy.fftpack import dct, idct
import os
import time
import base64
from io import BytesIO

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(
    __name__,
    static_folder=BASE_DIR,
    static_url_path=""
)

@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")



# JPEG-like quantization matrix
QUANTIZATION_MATRIX = np.array([
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99]
])


def dct2(block):
    return dct(dct(block.T, norm='ortho').T, norm='ortho')


def idct2(block):
    return idct(idct(block.T, norm='ortho').T, norm='ortho')


def compress_image(image, quality=50):

    image = image.convert("L")
    image_array = np.array(image, dtype=np.float64)

    height, width = image_array.shape

    padded_height = ((height + 7) // 8) * 8
    padded_width = ((width + 7) // 8) * 8

    padded = np.pad(
        image_array,
        ((0, padded_height - height),
         (0, padded_width - width)),
        mode="edge"
    )

    result = np.zeros_like(padded)

    # Quality control
    scale = max(1, (100 - quality) / 50)

    quant_matrix = QUANTIZATION_MATRIX * scale

    # Process 8 x 8 blocks
    for row in range(0, padded_height, 8):

        for col in range(0, padded_width, 8):

            block = padded[row:row + 8, col:col + 8]

            # Level shifting
            block = block - 128

            # DCT
            transformed = dct2(block)

            # Quantization
            quantized = np.round(transformed / quant_matrix)

            # De-quantization
            dequantized = quantized * quant_matrix

            # IDCT
            reconstructed = idct2(dequantized)

            # Level shifting back
            reconstructed = reconstructed + 128

            result[row:row + 8, col:col + 8] = reconstructed

    result = np.clip(result, 0, 255)

    return Image.fromarray(result[:height, :width].astype(np.uint8))


@app.route("/compress", methods=["POST"])
def compress():

    start_time = time.time()

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]

    original = Image.open(file).convert("RGB")

    compressed = compress_image(original, quality=50)

    # Save compressed image
    base_dir = os.path.dirname(os.path.dirname(__file__))

    output_dir = os.path.join(
        base_dir,
        "output_images"
    )

    # Create output_images folder if it does not exist
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(
        output_dir,
        "compressed_image.jpg"
    )

    compressed.save(
        output_path,
        "JPEG",
        quality=50
    )


    compressed.save(output_path, "JPEG", quality=50)

    # Convert image to Base64 for website
    buffer = BytesIO()
    compressed.save(buffer, format="JPEG", quality=50)

    image_base64 = base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")

    processing_time = time.time() - start_time

    return jsonify({
        "image": "data:image/jpeg;base64," + image_base64,
        "processing_time": round(processing_time, 4),
        "message": "DCT compression successful"
    })


if __name__ == "__main__":
    app.run(debug=True)