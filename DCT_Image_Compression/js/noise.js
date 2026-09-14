// -----------------------------
// NOISE PROCESSING
// -----------------------------

const noiseCanvas =
    document.getElementById("noiseCanvas");

const noiseName =
    document.getElementById("noiseName");

const gaussianNoiseBtn =
    document.getElementById("gaussianNoiseBtn");

const saltPepperNoiseBtn =
    document.getElementById("saltPepperNoiseBtn");


// --------------------------------------------------
// GET ALL ORIGINAL UPLOADED IMAGES
// --------------------------------------------------

function getAllNoiseImages() {

    // Use 5 uploaded images from upload.js
    if (
        typeof originalDataList !== "undefined" &&
        originalDataList.length > 0
    ) {

        // Create copies so original images are not changed
        return originalDataList.map(
            function (imageData) {

                return new ImageData(
                    new Uint8ClampedArray(
                        imageData.data
                    ),
                    imageData.width,
                    imageData.height
                );

            }
        );

    }


    // Single image fallback
    const originalImage =
        document.getElementById(
            "originalImage"
        );


    if (
        !originalImage ||
        !originalImage.src ||
        !originalImage.complete ||
        originalImage.naturalWidth === 0
    ) {

        alert(
            "Please upload image(s) first."
        );

        return [];

    }


    const imageData =
        getOriginalImageData(
            originalImage
        );


    if (!imageData) {
        return [];
    }


    return [imageData];

}


// --------------------------------------------------
// GET IMAGE DATA FROM IMAGE ELEMENT
// --------------------------------------------------

function getOriginalImageData(
    originalImage
) {

    const canvas =
        document.createElement("canvas");

    const width =
        originalImage.naturalWidth;

    const height =
        originalImage.naturalHeight;


    if (!width || !height) {
        return null;
    }


    canvas.width =
        width;

    canvas.height =
        height;


    const ctx =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true
            }
        );


    ctx.drawImage(
        originalImage,
        0,
        0,
        width,
        height
    );


    return ctx.getImageData(
        0,
        0,
        width,
        height
    );

}


// --------------------------------------------------
// CREATE MULTIPLE NOISE RESULT AREA
// --------------------------------------------------

function createNoiseResultArea() {

    let container =
        document.getElementById(
            "batchNoiseResults"
        );


    if (!container) {

        container =
            document.createElement("div");


        container.id =
            "batchNoiseResults";


        container.style.display =
            "grid";


        container.style.gridTemplateColumns =
            "repeat(auto-fit, minmax(300px, 1fr))";


        container.style.gap =
            "20px";


        container.style.marginTop =
            "25px";


        // Add after noise canvas
        if (noiseCanvas) {

            noiseCanvas.parentElement
                .appendChild(container);

        }
        else {

            document.body.appendChild(
                container
            );

        }

    }


    container.innerHTML = "";

    return container;

}


// --------------------------------------------------
// DISPLAY ALL NOISY IMAGES
// --------------------------------------------------

function displayNoiseImages(
    imageDataList,
    name
) {

    if (
        !imageDataList ||
        imageDataList.length === 0
    ) {

        return;

    }


    // Update title
    if (noiseName) {

        noiseName.textContent =
            name +
            " - " +
            imageDataList.length +
            " Image(s)";

    }


    // Hide old single canvas for multiple images
    if (
        noiseCanvas &&
        imageDataList.length > 1
    ) {

        noiseCanvas.style.display =
            "none";

    }


    // Show old canvas for one image
    if (
        noiseCanvas &&
        imageDataList.length === 1
    ) {

        noiseCanvas.style.display =
            "block";


        noiseCanvas.width =
            imageDataList[0].width;


        noiseCanvas.height =
            imageDataList[0].height;


        const ctx =
            noiseCanvas.getContext(
                "2d"
            );


        ctx.clearRect(
            0,
            0,
            noiseCanvas.width,
            noiseCanvas.height
        );


        ctx.putImageData(
            imageDataList[0],
            0,
            0
        );

    }


    // Create result cards
    const container =
        createNoiseResultArea();


    imageDataList.forEach(
        function (imageData, index) {

            const card =
                document.createElement("div");


            card.style.border =
                "1px solid #ddd";


            card.style.borderRadius =
                "12px";


            card.style.padding =
                "15px";


            card.style.background =
                "#ffffff";


            card.style.boxShadow =
                "0 4px 10px rgba(0,0,0,0.1)";


            const title =
                document.createElement("h3");


            title.textContent =
                "Image " +
                (index + 1);


            title.style.marginBottom =
                "12px";


            const canvas =
                document.createElement("canvas");


            canvas.width =
                imageData.width;


            canvas.height =
                imageData.height;


            canvas.style.width =
                "100%";


            canvas.style.height =
                "auto";


            canvas.style.maxHeight =
                "300px";


            canvas.style.objectFit =
                "contain";


            canvas.style.borderRadius =
                "8px";


            const ctx =
                canvas.getContext(
                    "2d"
                );


            ctx.putImageData(
                imageData,
                0,
                0
            );


            const label =
                document.createElement("p");


            label.textContent =
                name;


            label.style.marginTop =
                "10px";


            label.style.fontWeight =
                "bold";


            card.appendChild(
                title
            );


            card.appendChild(
                canvas
            );


            card.appendChild(
                label
            );


            container.appendChild(
                card
            );

        }
    );

}


// --------------------------------------------------
// GAUSSIAN RANDOM NUMBER
// --------------------------------------------------

function gaussianRandom() {

    let u = 0;
    let v = 0;


    while (u === 0) {
        u = Math.random();
    }


    while (v === 0) {
        v = Math.random();
    }


    return Math.sqrt(
        -2 * Math.log(u)
    ) *
    Math.cos(
        2 * Math.PI * v
    );

}


// --------------------------------------------------
// GAUSSIAN NOISE
// --------------------------------------------------

function addGaussianNoise(
    imageData,
    strength = 10
) {

    const data =
        imageData.data;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const noise =
            gaussianRandom() *
            strength;


        data[i] =
            Math.min(
                255,
                Math.max(
                    0,
                    data[i] + noise
                )
            );


        data[i + 1] =
            Math.min(
                255,
                Math.max(
                    0,
                    data[i + 1] + noise
                )
            );


        data[i + 2] =
            Math.min(
                255,
                Math.max(
                    0,
                    data[i + 2] + noise
                )
            );

    }


    return imageData;

}


// --------------------------------------------------
// SALT & PEPPER NOISE
// --------------------------------------------------

function addSaltPepperNoise(
    imageData,
    amount = 0.02
) {

    const data =
        imageData.data;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        if (
            Math.random() < amount
        ) {

            const value =
                Math.random() < 0.5
                    ? 0
                    : 255;


            data[i] =
                value;


            data[i + 1] =
                value;


            data[i + 2] =
                value;

        }

    }


    return imageData;

}


// --------------------------------------------------
// GAUSSIAN NOISE BUTTON
// --------------------------------------------------

if (gaussianNoiseBtn) {

    gaussianNoiseBtn.addEventListener(
        "click",
        function () {

            const images =
                getAllNoiseImages();


            if (images.length === 0) {
                return;
            }


            const results = [];


            images.forEach(
                function (imageData) {

                    const noisyImage =
                        addGaussianNoise(
                            imageData,
                            10
                        );


                    results.push(
                        noisyImage
                    );

                }
            );


            displayNoiseImages(
                results,
                "Gaussian Noise Applied"
            );

        }
    );

}


// --------------------------------------------------
// SALT & PEPPER NOISE BUTTON
// --------------------------------------------------

if (saltPepperNoiseBtn) {

    saltPepperNoiseBtn.addEventListener(
        "click",
        function () {

            const images =
                getAllNoiseImages();


            if (images.length === 0) {
                return;
            }


            const results = [];


            images.forEach(
                function (imageData) {

                    const noisyImage =
                        addSaltPepperNoise(
                            imageData,
                            0.02
                        );


                    results.push(
                        noisyImage
                    );

                }
            );


            displayNoiseImages(
                results,
                "Salt & Pepper Noise Applied"
            );

        }
    );

}