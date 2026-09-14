
import cv2
import numpy as np
from pathlib import Path

ALLOWED = {".jpg", ".jpeg", ".png", ".webp"}

def read_image(path):
    img = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("Invalid or unsupported image.")
    if len(img.shape) == 2:
        return img
    if img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    return img

def save_image(img, path):
    path = str(path)
    if not cv2.imwrite(path, img):
        raise ValueError("Could not save the processed image.")
    return path

def binary(img, threshold=127, inverse=False):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    mode = cv2.THRESH_BINARY_INV if inverse else cv2.THRESH_BINARY
    return cv2.threshold(gray, int(threshold), 255, mode)[1]

def convert(img, operation, threshold=127):
    if operation == "grayscale":
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if operation == "rgb":
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    if operation == "bgr":
        return img
    if operation == "binary":
        return binary(img, threshold)
    raise ValueError("Unknown conversion operation.")

def arithmetic(img1, img2, operation, value=1.0):
    if operation == "addition":
        if img2 is not None:
            return cv2.add(img1, img2)
        return cv2.add(img1, np.full_like(img1, int(value)))
    if operation == "subtraction":
        if img2 is not None:
            return cv2.subtract(img1, img2)
        return cv2.subtract(img1, np.full_like(img1, int(value)))
    if operation == "multiplication":
        return cv2.convertScaleAbs(img1, alpha=float(value), beta=0)
    raise ValueError("Unknown arithmetic operation.")

def bitwise(img1, img2, operation):
    if operation == "not":
        return cv2.bitwise_not(img1)
    if img2 is None:
        raise ValueError("A second image is required for this bitwise operation.")
    if img1.shape[:2] != img2.shape[:2]:
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
    if operation == "and":
        return cv2.bitwise_and(img1, img2)
    if operation == "or":
        return cv2.bitwise_or(img1, img2)
    if operation == "xor":
        return cv2.bitwise_xor(img1, img2)
    raise ValueError("Unknown bitwise operation.")

def transform(img, operation, **kw):
    h, w = img.shape[:2]
    if operation == "translation":
        x, y = float(kw.get("x", 0)), float(kw.get("y", 0))
        M = np.float32([[1, 0, x], [0, 1, y]])
        return cv2.warpAffine(img, M, (w, h))
    if operation == "rotation":
        angle = float(kw.get("angle", 0))
        M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1.0)
        return cv2.warpAffine(img, M, (w, h))
    if operation == "scaling":
        pct = float(kw.get("scale", 100)) / 100
        return cv2.resize(img, None, fx=pct, fy=pct, interpolation=cv2.INTER_LINEAR)
    if operation == "shear":
        sx, sy = float(kw.get("sx", 0)), float(kw.get("sy", 0))
        M = np.float32([[1, sx, 0], [sy, 1, 0]])
        return cv2.warpAffine(img, M, (w, h))
    if operation == "reflection":
        direction = kw.get("direction", "horizontal")
        return cv2.flip(img, 1 if direction == "horizontal" else 0)
    if operation == "crop":
        x, y = max(0, int(kw.get("x", 0))), max(0, int(kw.get("y", 0)))
        cw, ch = int(kw.get("width", w-x)), int(kw.get("height", h-y))
        if cw <= 0 or ch <= 0:
            raise ValueError("Crop width and height must be positive.")
        return img[y:min(y+ch,h), x:min(x+cw,w)]
    raise ValueError("Unknown transformation.")

def enhance(img, operation, **kw):
    if operation == "negative":
        return 255 - img
    if operation == "brightness_contrast":
        brightness = float(kw.get("brightness", 0))
        contrast = float(kw.get("contrast", 1))
        return cv2.convertScaleAbs(img, alpha=contrast, beta=brightness)
    if operation == "sharpen":
        kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]], np.float32)
        return cv2.filter2D(img, -1, kernel)
    if operation == "laplacian":
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        return cv2.convertScaleAbs(lap)
    if operation == "histogram":
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        return cv2.equalizeHist(gray)
    if operation == "threshold":
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        t = int(kw.get("threshold", 127))
        typemap = {
            "binary": cv2.THRESH_BINARY,
            "binary_inverse": cv2.THRESH_BINARY_INV,
            "truncate": cv2.THRESH_TRUNC,
            "to_zero": cv2.THRESH_TOZERO,
            "to_zero_inverse": cv2.THRESH_TOZERO_INV
        }
        typ = typemap.get(kw.get("mode", "binary"), cv2.THRESH_BINARY)
        return cv2.threshold(gray, t, 255, typ)[1]
    raise ValueError("Unknown enhancement.")

def spatial_filter(img, operation, **kw):
    if operation == "average":
        k = int(kw.get("kernel", 3))
        return cv2.blur(img, (k,k))
    if operation == "gaussian":
        k = int(kw.get("kernel", 5))
        if k % 2 == 0: k += 1
        sigma = float(kw.get("sigma", 0))
        return cv2.GaussianBlur(img, (k,k), sigma)
    if operation == "median":
        k = int(kw.get("kernel", 5))
        if k % 2 == 0: k += 1
        return cv2.medianBlur(img, k)
    if operation == "bilateral":
        d = int(kw.get("diameter", 9))
        sc = float(kw.get("sigma_color", 75))
        ss = float(kw.get("sigma_space", 75))
        return cv2.bilateralFilter(img, d, sc, ss)
    raise ValueError("Unknown spatial filter.")

def add_noise(img, noise_type, amount=25):
    arr = img.astype(np.float32)
    if noise_type == "gaussian":
        noise = np.random.normal(0, float(amount), arr.shape)
        return np.clip(arr + noise, 0, 255).astype(np.uint8)
    if noise_type == "salt_pepper":
        out = img.copy()
        prob = min(max(float(amount)/1000, 0.001), 0.5)
        rnd = np.random.random(img.shape[:2])
        out[rnd < prob/2] = 0
        out[rnd > 1-prob/2] = 255
        return out
    raise ValueError("Unknown noise type.")

def restore(img, operation, **kw):
    if operation == "noise":
        return add_noise(img, kw.get("noise_type", "gaussian"), kw.get("amount", 25))
    if operation == "gaussian_denoise":
        return cv2.GaussianBlur(img, (5,5), 0)
    if operation == "median_denoise":
        return cv2.medianBlur(img, 5)
    if operation == "nlm":
        return cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
    if operation in ("telea", "navier_stokes"):
        mask = kw.get("mask")
        if mask is None:
            raise ValueError("A mask is required for inpainting.")
        if mask.shape[:2] != img.shape[:2]:
            mask = cv2.resize(mask, (img.shape[1], img.shape[0]))
        method = cv2.INPAINT_TELEA if operation == "telea" else cv2.INPAINT_NS
        return cv2.inpaint(img, mask, 3, method)
    raise ValueError("Unknown restoration operation.")

def morphology(img, operation, shape="rectangle", kernel=5):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape)==3 else img
    _, bw = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    shape_map = {"rectangle": cv2.MORPH_RECT, "ellipse": cv2.MORPH_ELLIPSE, "cross": cv2.MORPH_CROSS}
    k = cv2.getStructuringElement(shape_map.get(shape, cv2.MORPH_RECT), (int(kernel), int(kernel)))
    if operation == "erosion": return cv2.erode(bw, k)
    if operation == "dilation": return cv2.dilate(bw, k)
    if operation == "opening": return cv2.morphologyEx(bw, cv2.MORPH_OPEN, k)
    if operation == "closing": return cv2.morphologyEx(bw, cv2.MORPH_CLOSE, k)
    if operation == "gradient": return cv2.morphologyEx(bw, cv2.MORPH_GRADIENT, k)
    if operation == "tophat": return cv2.morphologyEx(bw, cv2.MORPH_TOPHAT, k)
    if operation == "blackhat": return cv2.morphologyEx(bw, cv2.MORPH_BLACKHAT, k)
    if operation == "hitmiss":
        # OpenCV hit-or-miss expects binary 0/1 data.
        small = (bw > 0).astype(np.uint8)
        hm = cv2.morphologyEx(small, cv2.MORPH_HITMISS, np.array([[-1,-1,-1],[-1,1,-1],[-1,-1,-1]], np.int8))
        return (hm * 255).astype(np.uint8)
    if operation == "skeleton":
        skel = np.zeros(bw.shape, np.uint8)
        temp = bw.copy()
        while True:
            eroded = cv2.erode(temp, k)
            opened = cv2.morphologyEx(eroded, cv2.MORPH_OPEN, k)
            skel = cv2.bitwise_or(skel, cv2.subtract(eroded, opened))
            temp = eroded
            if cv2.countNonZero(temp) == 0:
                break
        return skel
    if operation == "pruning":
        # Practical-friendly approximation: skeleton followed by small opening.
        sk = morphology(img, "skeleton", shape, kernel)
        return cv2.morphologyEx(sk, cv2.MORPH_OPEN, np.ones((3,3), np.uint8))
    raise ValueError("Unknown morphology operation.")

def object_analysis(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape)==3 else img
    _, bw = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    areas = sorted([float(cv2.contourArea(c)) for c in contours if cv2.contourArea(c) > 0], reverse=True)
    return {"objects": len(areas), "areas": areas[:20], "contours": len(contours)}

def correlation_detect(img, template, threshold=0.8):
    """Detect the best template match using normalized cross-correlation."""
    if template is None:
        raise ValueError("A template image is required for correlation object detection.")
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    gray_template = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY) if len(template.shape) == 3 else template
    th, tw = gray_template.shape[:2]
    ih, iw = gray_img.shape[:2]
    if th > ih or tw > iw:
        raise ValueError("Template image must be smaller than the target image.")
    result = cv2.matchTemplate(gray_img, gray_template, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv2.minMaxLoc(result)
    output = img.copy()
    detected = float(max_val) >= float(threshold)
    x, y = max_loc
    if detected:
        cv2.rectangle(output, (x, y), (x + tw, y + th), (0, 255, 255), 3)
        cv2.putText(output, f"Match: {max_val:.2f}", (x, max(25, y - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    return output, {
        "detected": detected,
        "best_score": float(max_val),
        "best_x": int(x),
        "best_y": int(y),
        "threshold": float(threshold)
    }


# ---------------- POST LAB 02: COLOR SPACE OPERATIONS ----------------
def color_space(img, operation):
    """Convert an image to the color spaces/channels covered in Post Lab 02."""
    if img is None:
        raise ValueError("Input image is required.")
    if len(img.shape) == 2:
        bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    else:
        bgr = img

    if operation == "rgb":
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    if operation == "hsv":
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    if operation == "ycrcb":
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
    if operation == "lab":
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    if operation == "grayscale":
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    if operation.startswith("hsv_"):
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        channels = {"hsv_h": 0, "hsv_s": 1, "hsv_v": 2}
        return hsv[:, :, channels[operation]]

    if operation.startswith("ycrcb_"):
        ycc = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
        channels = {"ycrcb_y": 0, "ycrcb_cr": 1, "ycrcb_cb": 2}
        return ycc[:, :, channels[operation]]

    if operation.startswith("lab_"):
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
        channels = {"lab_l": 0, "lab_a": 1, "lab_b": 2}
        return lab[:, :, channels[operation]]

    if operation.startswith("rgb_"):
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        channels = {"rgb_r": 0, "rgb_g": 1, "rgb_b": 2}
        return rgb[:, :, channels[operation]]

    raise ValueError("Unknown color-space operation.")


# ---------------- POST LAB 03: EDGE DETECTION ----------------
def edge_detect(img, operation, **kw):
    """Canny, Sobel and Prewitt edge detectors from Post Lab 03."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

    if operation == "canny":
        blurred = cv2.GaussianBlur(gray, (5, 5), 1.4)
        lower = int(kw.get("lower", 50))
        upper = int(kw.get("upper", 150))
        aperture = int(kw.get("aperture", 3))
        if aperture not in (3, 5, 7):
            aperture = 3
        l2 = str(kw.get("l2", "false")).lower() == "true"
        return cv2.Canny(blurred, lower, upper, apertureSize=aperture, L2gradient=l2)

    if operation == "sobel":
        k = int(kw.get("kernel", 3))
        if k not in (1, 3, 5, 7):
            k = 3
        sx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=k)
        sy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=k)
        mag = cv2.magnitude(sx.astype(np.float32), sy.astype(np.float32))
        return cv2.convertScaleAbs(mag)

    if operation == "prewitt":
        kernelx = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], dtype=np.float32)
        kernely = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], dtype=np.float32)
        px = cv2.filter2D(gray, cv2.CV_32F, kernelx)
        py = cv2.filter2D(gray, cv2.CV_32F, kernely)
        mag = cv2.magnitude(px, py)
        return cv2.convertScaleAbs(mag)

    raise ValueError("Unknown edge-detection operation.")
