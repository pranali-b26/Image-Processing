import cv2
import numpy as np


def detect_object(template_path, input_image_path):

    # Read template image in grayscale
    template = cv2.imread(template_path, 0)

    # Read input image
    img = cv2.imread(input_image_path)

    # Check template image
    if template is None:
        print("Template image not found!")
        return

    # Check input image
    if img is None:
        print("Input image not found!")
        return

    # Convert input image to grayscale
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Get template height and width
    h, w = template.shape

    # Template matching
    result = cv2.matchTemplate(
        gray_img,
        template,
        cv2.TM_CCOEFF_NORMED
    )

    # Matching threshold
    threshold = 0.8

    # Find matching locations
    locations = np.where(result >= threshold)

    # Draw rectangle around detected object
    for pt in zip(*locations[::-1]):
        cv2.rectangle(
            img,
            pt,
            (pt[0] + w, pt[1] + h),
            (0, 255, 255),
            2
        )

    # Display output
    cv2.imshow("Detected Objects", img)

    cv2.waitKey(0)
    cv2.destroyAllWindows()


# Image paths
template_path = "i1.jpg"
input_image_path = "animal.jpg"

# Detect object
detect_object(template_path, input_image_path)