
# Image Processing Virtual Laboratory

A professional, interactive college practical website for Image Processing Practical 02–11 using Python, Flask, OpenCV, NumPy, HTML, CSS and JavaScript.

## Features

- Practical 02: RGB/BGR/grayscale/binary conversion, arithmetic and bitwise operations
- Practical 03: translation, rotation, scaling, shearing, reflection and cropping
- Practical 04: negative, brightness/contrast, sharpening, Laplacian, histogram equalization and thresholding
- Practical 05: averaging, Gaussian, median and bilateral filters
- Practical 06: Gaussian/Salt & Pepper noise, denoising and Telea/Navier-Stokes inpainting
- Practical 07: PNG/JPEG compression metrics and an interface for RLE/LZW study
- Practical 08: erosion, dilation, opening, closing, hit-or-miss, gradient, top-hat, black-hat, skeletonization and pruning
- Practical 09: correlation-based object detection using template matching
- Practical 10: RGB, HSV, YCrCb and Lab color-space conversion and channel visualization
- Practical 11: Canny edge detection with Sobel and Prewitt comparison
- Upload/drag-and-drop image preview
- Before/after result view
- Download processed output
- Python/OpenCV code viewer
- Viva/discussion questions
- Dark mode
- Responsive sidebar/mobile layout
- Student information stored locally in the browser
- Error handling and file-size/type validation

## Installation

Python 3.10+ is recommended.

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

Install packages:

```bash
pip install -r requirements.txt
```

Run:

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Image Upload

The uploader supports both **Drag & Drop** and **Browse Image**. Click anywhere inside the upload box or click **Browse Image** to open the file picker. Supported formats are JPG, JPEG, PNG and WEBP, with a maximum file size of 12 MB.

After selecting an image, the original preview and filename/size are shown before you click **Apply Operation**. Invalid formats and oversized files are rejected with a message.

## Built-in Sample Images

The project includes ready-to-use generated sample images in `static/images/samples/`:

- `color_sample.png` — color/RGB operations
- `grayscale_sample.png` — grayscale experiments
- `noisy_sample.png` — denoising/restoration
- `damaged_sample.png` — inpainting
- `damaged_mask.png` — built-in mask for the damaged sample
- `binary_sample.png` — thresholding and morphology

Use the **Built-in Sample Images** buttons inside each practical. No manual image download is required.

## Notes

- Upload JPG, JPEG, PNG or WEBP images.
- Practical 02 arithmetic/bitwise operations that combine images accept a second image and resize it to match the first image when necessary.
- Practical 06 inpainting requires a mask image. White pixels identify the region to restore.
- Practical 07 reports actual file sizes for PNG/JPEG output. The UI also provides RLE/LZW entries for study; these are not presented as fake file-compression results.
- Generated files are kept in `outputs/`. Uploaded files are kept in `uploads/`.

## Folder Structure

```text
image-processing-lab/
├── app.py
├── processing.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── script.js
│   └── images/
├── uploads/
└── outputs/
```

## Practical workflow

1. Select a practical from the sidebar.
2. Read the Aim, Objectives and Theory.
3. Upload an image.
4. Select an operation.
5. Set parameters.
6. Click **Apply Operation**.
7. Compare Original and Processed images.
8. Download the result.
9. Open **View Python Code** for the corresponding code snippet.
10. Use the Viva section for revision.

## Troubleshooting

### `ModuleNotFoundError`
Run:

```bash
pip install -r requirements.txt
```

### OpenCV import error
Try reinstalling:

```bash
pip uninstall opencv-python
pip install opencv-python
```

### Port already in use
Change the port at the bottom of `app.py`, for example:

```python
app.run(debug=True, host="127.0.0.1", port=5001)
```

### Image rejected
Use JPG, JPEG, PNG or WEBP and keep the file under 12 MB.

## Source basis

The practical organization and requested operations are based on the supplied Practical 02–08 material. The website keeps the practical scope student-friendly and combines the experiments into one virtual laboratory.


## Added Post Lab 02 and Post Lab 03

The project now includes the supplied Post Lab 02 color-space experiments and Post Lab 03 edge-detection experiments as new Practical 10 and Practical 11 entries. Existing Practical 02–09 operations remain available; the additions are connected through the same Flask API, processing module, upload flow, result viewer, code viewer and navigation.


## Added Post Lab Topics
- Post Lab 02 — Color Space Conversion: RGB, HSV, YCrCb, Lab, Grayscale and channel analysis.
- Post Lab 03 — Edge Detection: Canny, Sobel, Prewitt, Canny thresholds, aperture size and L2 gradient.

## Post Lab 02 & 03

The dashboard now includes two connected practical topics:

- **Practical 10 — Post Lab 02: Color Space Conversion**: Convert images between RGB, HSV, YCrCb and Lab colour spaces and analyze how colour information is encoded in each. The experiment also provides grayscale and individual channel views.
- **Practical 11 — Post Lab 03: Edge Detection**: Detect edges using Canny and compare the results with Sobel and Prewitt detectors. Canny controls include lower/upper thresholds, aperture size and L2 gradient.

The original Post Lab PDFs are included in the `docs` folder for reference.
