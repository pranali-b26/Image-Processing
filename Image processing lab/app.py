
from flask import Flask, render_template, request, jsonify, send_from_directory
from pathlib import Path
import uuid, json, os, cv2, numpy as np
from processing import *

BASE = Path(__file__).resolve().parent
UPLOADS = BASE / "uploads"
OUTPUTS = BASE / "outputs"
UPLOADS.mkdir(exist_ok=True)
OUTPUTS.mkdir(exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024

@app.errorhandler(413)
def request_too_large(error):
    return jsonify({"success": False, "error": "Image is too large. Maximum upload size is 12 MB."}), 413

PRACTICALS = [
    {"id":2, "title":"Image Formats & Operations", "short":"RGB, grayscale, binary, arithmetic & bitwise"},
    {"id":3, "title":"Geometric Transformations", "short":"Translation, rotation, scaling, shearing, reflection & crop"},
    {"id":4, "title":"Image Enhancement", "short":"Negative, brightness/contrast, sharpening, histogram & threshold"},
    {"id":5, "title":"Spatial Filtering", "short":"Averaging, Gaussian, median & bilateral"},
    {"id":6, "title":"Image Restoration", "short":"Noise, denoising & Telea/Navier-Stokes inpainting"},
    {"id":7, "title":"Lossless Image Compression", "short":"PNG/JPEG, RLE, LZW and compression metrics"},
    {"id":8, "title":"Morphological Operations", "short":"Erosion, dilation, opening, closing & advanced morphology"},
    {"id":9, "title":"Correlation-Based Object Detection", "short":"Detect and localize an object using template matching and correlation"},
    {"id":10, "title":"Color Space Conversion", "short":"Convert images between RGB, HSV, YCrCb and Lab colour spaces; analyze colour encoding"},
    {"id":11, "title":"Edge Detection", "short":"Detect edges with Canny and compare Sobel and Prewitt detectors"},
]

AIMS = {
2:"Convert images between RGB and Grayscale and perform arithmetic and bitwise operations.",
3:"Perform 2-D geometric transformations on images.",
4:"Enhance images using intensity, histogram, sharpening and thresholding techniques.",
5:"Study spatial-domain smoothing filters and compare their effects.",
6:"Study image restoration using noise models, denoising and inpainting.",
7:"Implement lossless compression techniques and compare original/compressed sizes.",
8:"Perform erosion, dilation, opening and closing on binary images to study shape effects and noise removal.",
9:"Develop a program to detect object using the correlation principle.",
10:"Convert images between RGB, HSV, YCrCb and Lab colour spaces and analyze their channels.",
11:"Detect edges using Canny and compare the results with Sobel and Prewitt detectors."
}

OBJECTIVES = {
2:["Understand RGB, grayscale and binary image representations.","Perform RGB/grayscale conversion.","Apply arithmetic and bitwise image operations."],
3:["Apply translation, rotation and scaling.","Perform X/Y shearing and reflection.","Crop an image using selected coordinates."],
4:["Adjust brightness and contrast.","Apply negative and sharpening operations.","Perform histogram equalization and thresholding."],
5:["Understand spatial filtering.","Compare averaging, Gaussian, median and bilateral filters.","Observe smoothing and edge-preserving effects."],
6:["Generate Gaussian and Salt & Pepper noise.","Apply denoising filters.","Restore damaged regions using masks and inpainting."],
7:["Understand lossless compression.","Implement/compare RLE and LZW.","Measure compressed size, ratio and decompression correctness."],
8:["Understand structuring elements.","Apply erosion, dilation, opening and closing.","Study advanced morphology and object/contour information."],
9:["Identify and locate objects in images using correlation-based object detection.","Apply correlation-based object detection to different objects and images.","Optimize a correlation-based object detection algorithm for performance."],
10:["Understand and apply color space conversion techniques in OpenCV by transforming images between RGB, HSV, YCrCb and Lab formats.","Analyze how hue, brightness and chrominance are encoded in different color spaces.","Visualize individual channels such as Hue, Saturation, Lightness, Cr and Cb.","Evaluate the suitability of each color space for enhancement, segmentation and compression."],
11:["Implement edge detection on grayscale images using the Canny method.","Apply Sobel and Prewitt operators and understand their working principles.","Compare Canny, Sobel and Prewitt in terms of edge clarity, noise sensitivity and computational complexity.","Visualize and analyze the differences between gradient-based and multi-stage edge maps.","Understand how to select an appropriate edge detector for different image-processing applications."]
}

THEORY = {
2:"OpenCV loads color images in BGR order by default. Images can be converted to RGB, grayscale or binary representations. Arithmetic operations change pixel intensities, while bitwise operations combine pixel-level binary representations.",
3:"Geometric transformations change an image's position, orientation, size or shape using transformation matrices and coordinate mapping.",
4:"Enhancement improves the visual appearance or useful information in an image. Histogram equalization redistributes grayscale intensities, while thresholding separates pixels according to an intensity level.",
5:"Spatial filters operate on a neighborhood around each pixel. Averaging and Gaussian filters smooth images, median filtering is useful for impulse noise, and bilateral filtering can smooth while preserving edges.",
6:"Restoration attempts to recover a cleaner image from a degraded one. Noise models simulate degradation; filters reduce noise; inpainting reconstructs selected damaged regions from surrounding information.",
7:"Lossless compression allows exact reconstruction of the original data. RLE and LZW reduce redundancy, while file-size comparisons can be used to calculate compression ratio and space saved.",
8:"Morphological processing works mainly on binary images using a structuring element. Erosion shrinks foreground regions, dilation expands them, opening removes small objects/noise, and closing can fill small gaps or holes.",
9:"The Correlation Principle detects an object by sliding a template image over a larger image and measuring similarity at each position. Normalized Cross-Correlation (NCC) gives a correlation score, and the position with the highest score indicates the best match. A threshold can also be used to identify matches above a chosen similarity level. This technique is useful in pattern recognition, surveillance, autonomous systems and industrial inspection.",
10:"A color model represents colors using numerical components. The Post Lab 02 practical converts images between RGB, HSV, YCrCb and Lab and analyzes how color information is encoded. RGB represents color with red, green and blue components. HSV separates Hue, Saturation and Value, making color-based segmentation and filtering easier. YCrCb separates luminance Y from chrominance Cr and Cb and is useful in compression and transmission. Lab uses L* for lightness, a* on the green-red axis and b* on the blue-yellow axis and is designed to be perceptually uniform. Grayscale uses one intensity channel with values from 0 to 255. Individual channels can be visualized to understand color and intensity information.",
11:"An edge is a boundary where there is a significant change in image intensity or color. The Post Lab 03 practical detects edges using Canny and contrasts the result with Sobel and Prewitt detectors. Sobel and Prewitt are gradient-based methods that calculate horizontal and vertical intensity changes. Canny is a multi-stage detector that includes Gaussian smoothing, gradient calculation, non-maximum suppression and hysteresis thresholding. In OpenCV, Canny can be controlled with lower and upper thresholds, aperture size and the L2Gradient option. These methods can be compared in terms of edge clarity, noise sensitivity and edge continuity."
}

CONCLUSIONS = {
2:"Different image representations and pixel operations produce different visual and data-level results.",
3:"Geometric transformations allow an image to be repositioned, resized, rotated, distorted, reflected and cropped.",
4:"Enhancement techniques can improve contrast, sharpness and segmentation according to the image and selected parameters.",
5:"Different spatial filters produce different smoothing and edge-preservation behavior.",
6:"Appropriate noise models, denoising filters and inpainting methods can improve degraded images.",
7:"Compression performance depends on image content and the selected method; lossless methods preserve exact data.",
8:"Morphological operations modify object shapes and can be used for noise removal, gap filling and object analysis.",
9:"The correlation-based method successfully identifies and localizes the template object in the target image. The best correlation score and bounding box provide a clear indication of the detected object.",
10:"RGB, HSV, YCrCb and Lab provide different ways to encode color and intensity. Examining their channels helps select an appropriate representation for image processing tasks.",
11:"Canny, Sobel and Prewitt can all detect image edges, but they differ in smoothness, noise sensitivity and edge continuity. Comparing their edge maps helps select a suitable detector for an application."
}

VIVA = {
2:[("What is the difference between RGB and grayscale?","RGB stores three color channels, while grayscale represents intensity using one channel."),("Why does OpenCV often need RGB/BGR conversion?","OpenCV commonly reads color images as BGR, while many other tools use RGB ordering.")],
3:[("What is translation?","Translation shifts every image point by specified X and Y distances."),("What is scaling?","Scaling changes the size of an image along one or both dimensions.")],
4:[("What does histogram equalization do?","It redistributes intensity values to improve contrast in many images."),("What is thresholding?","Thresholding classifies pixels according to an intensity threshold.")],
5:[("Which filter is useful for salt-and-pepper noise?","Median filtering is commonly effective because it replaces a pixel using neighborhood order statistics.")],
6:[("What is inpainting?","Inpainting reconstructs missing or damaged image regions using surrounding information."),("What is the Telea method?","Telea is a fast marching based inpainting method available in OpenCV.")],
7:[("What is lossless compression?","Compression where decompression can reconstruct the original data exactly."),("What is RLE?","Run-Length Encoding represents consecutive repeated values as runs.")],
8:[("What is erosion?","Erosion generally shrinks foreground regions and can remove small objects."),("What is dilation?","Dilation generally expands foreground regions and can connect nearby components."),("Why is a structuring element important?","Its shape and size determine how the morphology operation changes objects.")],
9:[("What is the Correlation Principle?","It compares a template with regions of a larger image to measure their similarity."),("What is template matching?","A template is systematically moved over the target image and a similarity score is calculated at each position."),("What does the highest correlation score indicate?","It indicates the position where the template most closely matches the target image."),("What library is commonly used in Python?","OpenCV provides cv2.matchTemplate() for template matching.")],
10:[("How does HSV separate color information?","HSV separates Hue and Saturation from Value, so color can be analyzed separately from brightness."),("What do Y, Cr and Cb represent?","Y is luminance, Cr is the red-difference chroma component, and Cb is the blue-difference chroma component."),("Why is Lab considered useful for color comparison?","Lab is designed to be perceptually uniform, so color differences more closely correspond to human visual perception."),("Why are individual channels useful?","A channel can isolate a particular color, chrominance or lightness component that may be harder to analyze directly in RGB."),("What challenge can occur during color-space conversion?","Different spaces use different ranges and encodings, so the converted data must be interpreted using the correct channel definitions.")],
11:[("How do Canny, Sobel and Prewitt differ?","Sobel and Prewitt are gradient-based operators, while Canny is a multi-stage edge detector."),("Why does Canny usually produce thinner and more continuous edges?","Canny uses smoothing, gradient processing, non-maximum suppression and hysteresis thresholding to refine the edge map."),("How does image noise affect edge detection?","Noise can create false edges, so smoothing such as Gaussian blur is useful before Canny detection."),("What does aperture size control in Canny?","It specifies the Sobel filter aperture used to calculate gradients and must be an odd value such as 3, 5 or 7."),("What do the Canny thresholds control?","The lower and upper thresholds control hysteresis thresholding and influence which gradient responses become connected edges."),("What is L2Gradient?","It enables the more precise L2 norm for calculating the edge gradient.")],
}

@app.get("/")
def index():
    return render_template("index.html", practicals=PRACTICALS)

@app.get("/api/practicals")
def practicals():
    return jsonify(PRACTICALS)

def get_file(field):
    f = request.files.get(field)
    if not f or not f.filename:
        raise ValueError("No image uploaded.")
    ext = Path(f.filename).suffix.lower()
    if ext not in ALLOWED:
        raise ValueError("Unsupported format. Use JPG, JPEG, PNG or WEBP.")
    name = f"{uuid.uuid4().hex}{ext}"
    path = UPLOADS / name
    f.save(path)
    return path

@app.post("/api/process")
def process():
    try:
        practical = int(request.form.get("practical", 0))
        operation = request.form.get("operation", "")
        path = get_file("image")
        img = read_image(path)
        result = None
        meta = {}

        if practical == 2:
            if operation in {"and","or","xor","addition","subtraction"}:
                p2 = get_file("image2")
                img2 = read_image(p2)
                if operation in {"and","or","xor"}:
                    result = bitwise(img, img2, operation)
                else:
                    result = arithmetic(img, img2, operation)
            elif operation == "not":
                result = bitwise(img, None, "not")
            elif operation == "multiplication":
                result = arithmetic(img, None, operation, float(request.form.get("value", 1.5)))
            else:
                result = convert(img, operation, int(request.form.get("threshold",127)))

        elif practical == 3:

            params = request.form.to_dict()
            params.pop("operation", None)

            result = transform(img, operation, **params)

        elif practical == 4:

            params = request.form.to_dict()
            params.pop("operation", None)

            result = enhance(img, operation, **params)

        elif practical == 5:

            params = request.form.to_dict()
            params.pop("operation", None)

            result = spatial_filter(img, operation, **params)

        elif practical == 6:

            params = request.form.to_dict()
            params.pop("operation", None)

            if operation in {"telea", "navier_stokes"}:

                # Mask is required for inpainting
                mf = request.files.get("mask")

                if not mf or not mf.filename:
                    raise ValueError(
                        "Upload a black/white mask for inpainting."
                    )

                mask_ext = Path(mf.filename).suffix.lower()

                if mask_ext not in ALLOWED:
                    raise ValueError(
                        "Unsupported mask format. "
                        "Use JPG, JPEG, PNG or WEBP."
                    )

                mp = UPLOADS / f"{uuid.uuid4().hex}_mask{mask_ext}"
                mf.save(mp)

                mask = cv2.imread(
                    str(mp),
                    cv2.IMREAD_GRAYSCALE
                )

                if mask is None:
                    raise ValueError("Invalid mask image.")

                result = restore(
                    img,
                    operation,
                    mask=mask,
                    **params
                )

            else:

                result = restore(
                    img,
                    operation,
                    **params
                )
        elif practical == 7:
            # File-level compression. PNG is lossless; JPEG is lossy.
            mode = request.form.get("mode","png")
            out_ext = ".jpg" if mode == "jpeg" else ".png"
            out = OUTPUTS / f"{uuid.uuid4().hex}{out_ext}"
            if mode == "jpeg":
                q = max(0, min(100, int(request.form.get("quality",90))))
                cv2.imwrite(str(out), img, [cv2.IMWRITE_JPEG_QUALITY, q])
            else:
                level = max(0, min(9, int(request.form.get("level",6))))
                cv2.imwrite(str(out), img, [cv2.IMWRITE_PNG_COMPRESSION, level])
            original_size = path.stat().st_size
            compressed_size = out.stat().st_size
            ratio = original_size / compressed_size if compressed_size else 0
            saved = max(0, (1 - compressed_size/original_size)*100) if original_size else 0
            return jsonify({
                "success":True,
                "url":f"/outputs/{out.name}",
                "filename":out.name,
                "metrics":{"original_size":original_size,"compressed_size":compressed_size,"ratio":ratio,"space_saved":saved}
            })

        elif practical == 8:
            result = morphology(img, operation, request.form.get("shape","rectangle"), int(request.form.get("kernel",5)))
            if operation in {"erosion","dilation","opening","closing"}:
                meta = object_analysis(result)

        elif practical == 10:
            result = color_space(img, operation)

        elif practical == 11:
            params = request.form.to_dict()
            params.pop("operation", None)
            result = edge_detect(img, operation, **params)

        elif practical == 9:
            tf = request.files.get("template")
            if not tf or not tf.filename:
                raise ValueError("Upload a template image representing the object to detect.")
            text = Path(tf.filename).suffix.lower()
            if text not in ALLOWED:
                raise ValueError("Unsupported template format. Use JPG, JPEG, PNG or WEBP.")
            tp = UPLOADS / f"{uuid.uuid4().hex}_template{text}"
            tf.save(tp)
            template = read_image(tp)
            threshold = max(0.0, min(1.0, float(request.form.get("match_threshold", 0.8))))
            result, meta = correlation_detect(img, template, threshold)
        else:
            raise ValueError("Invalid practical.")

        out = OUTPUTS / f"{uuid.uuid4().hex}.png"
        save_image(result, out)
        return jsonify({
            "success":True,
            "url":f"/outputs/{out.name}",
            "filename":out.name,
            "meta":meta
        })
    except Exception as e:
        return jsonify({"success":False,"error":str(e)}), 400

@app.get("/api/info/<int:pid>")
def info(pid):
    p = next((x for x in PRACTICALS if x["id"] == pid), None)
    if not p:
        return jsonify({"error":"Not found"}), 404
    algorithms = {
        2:["Read the input image with OpenCV.","Convert the image to the selected format or representation.","Apply the selected arithmetic or bitwise operation when required.","Display and save the result."],
        3:["Read the input image and get its dimensions.","Create the required transformation matrix or crop coordinates.","Apply the selected geometric transformation.","Display and save the transformed image."],
        4:["Read the input image.","Apply the selected enhancement or thresholding method.","Generate the enhanced image.","Display and save the result."],
        5:["Read the input image.","Select a spatial filter and kernel parameters.","Apply the filter using neighborhood pixels.","Display and save the filtered image."],
        6:["Read the image or generate the selected noise.","Apply the selected denoising or inpainting method.","Use a mask for Telea or Navier-Stokes when required.","Display and save the restored result."],
        7:["Read the uploaded image.","Select PNG or JPEG and its compression parameter.","Write the compressed image.","Compare original and compressed file sizes."],
        8:["Convert the input image to binary.","Create the selected structuring element.","Apply the selected morphological operation.","Display and save the processed binary image."],
        9:["Read the target image and template image.","Slide the template over the target image and calculate the normalized cross-correlation score.","Find the position with the highest correlation score.","Compare scores with the selected threshold and draw bounding boxes around matches.","Display and save the target image with the detected object highlighted."],
        10:["Read the color image.","Convert it to the selected RGB, HSV, YCrCb or Lab color space.","Optionally isolate the requested color-space channel.","Display and save the converted result."],
        11:["Read the image and convert it to grayscale.","Apply Gaussian smoothing for Canny edge detection.","Apply Canny, Sobel or Prewitt edge detection using the selected parameters.","Display and save the resulting edge map."]
    }
    return jsonify({
        **p, "aim":AIMS[pid], "objectives":OBJECTIVES[pid],
        "theory":THEORY[pid], "conclusion":CONCLUSIONS[pid],
        "algorithm":algorithms.get(pid,[]), "viva":VIVA.get(pid,[])
    })

@app.get("/outputs/<path:name>")
def outputs(name):
    return send_from_directory(OUTPUTS, name, as_attachment=False)

@app.get("/api/code/<int:pid>/<operation>")
def code(pid, operation):
    snippets = {
        "grayscale": 'img = cv2.imread("input.jpg")\ngray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\ncv2.imwrite("grayscale.png", gray)',
        "negative": 'negative = 255 - img\ncv2.imwrite("negative.png", negative)',
        "gaussian": 'blur = cv2.GaussianBlur(img, (5, 5), 0)\ncv2.imwrite("gaussian.png", blur)',
        "median": 'result = cv2.medianBlur(img, 5)\ncv2.imwrite("median.png", result)',
        "erosion": 'kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))\nresult = cv2.erode(binary, kernel)',
        "dilation": 'kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))\nresult = cv2.dilate(binary, kernel)',
        "opening": 'result = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)',
        "closing": 'result = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)',
        "rotation": 'M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1.0)\nresult = cv2.warpAffine(img, M, (w, h))',
        "threshold": 'gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n_, result = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)',
        "laplacian": 'gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\nlap = cv2.Laplacian(gray, cv2.CV_64F)\nresult = cv2.convertScaleAbs(lap)',
        "correlation": 'template = cv2.imread("template.jpg", 0)\ngray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\nres = cv2.matchTemplate(gray, template, cv2.TM_CCOEFF_NORMED)\n_, max_val, _, max_loc = cv2.minMaxLoc(res)\nw, h = template.shape[::-1]\ncv2.rectangle(img, max_loc, (max_loc[0]+w, max_loc[1]+h), (0,255,255), 2)',
        "hsv": 'hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)',
        "ycrcb": 'ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)',
        "lab": 'lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)',
        "rgb_r": 'rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)\nr = rgb[:, :, 0]',
        "rgb_g": 'rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)\ng = rgb[:, :, 1]',
        "rgb_b": 'rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)\nb = rgb[:, :, 2]',
        "hsv_h": 'hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)\nh = hsv[:, :, 0]',
        "hsv_s": 'hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)\ns = hsv[:, :, 1]',
        "hsv_v": 'hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)\nv = hsv[:, :, 2]',
        "ycrcb_y": 'ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)\ny = ycrcb[:, :, 0]',
        "ycrcb_cr": 'ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)\ncr = ycrcb[:, :, 1]',
        "ycrcb_cb": 'ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)\ncb = ycrcb[:, :, 2]',
        "lab_l": 'lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)\nl = lab[:, :, 0]',
        "lab_a": 'lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)\na = lab[:, :, 1]',
        "lab_b": 'lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)\nb = lab[:, :, 2]',
        "canny": 'gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\nblurred = cv2.GaussianBlur(gray, (5, 5), 1.4)\nedges = cv2.Canny(blurred, 50, 150)',
        "sobel": 'gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\nsobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)\nsobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)\nsobel_edges = cv2.convertScaleAbs(cv2.magnitude(sobelx.astype(np.float32), sobely.astype(np.float32)))',
        "prewitt": 'gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\nkernelx = np.array([[-1,0,1],[-1,0,1],[-1,0,1]], dtype=np.float32)\nkernely = np.array([[-1,-1,-1],[0,0,0],[1,1,1]], dtype=np.float32)\nprewitt_edges = cv2.convertScaleAbs(cv2.magnitude(cv2.filter2D(gray, cv2.CV_32F, kernelx), cv2.filter2D(gray, cv2.CV_32F, kernely)))'
    }
    return jsonify({"code":snippets.get(operation, "# Python/OpenCV code for this operation\n# See the experiment controls and processing.py.")})

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
