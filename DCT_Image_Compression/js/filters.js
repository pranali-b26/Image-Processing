// -----------------------------
// IMAGE FILTERS
// -----------------------------

const filteredCanvas =
    document.getElementById("filteredCanvas");

const filterName =
    document.getElementById("filterName");

const averageButton =
    document.getElementById("averageFilter");

const gaussianButton =
    document.getElementById("gaussianFilter");

const medianButton =
    document.getElementById("medianFilter");

const bilateralButton =
    document.getElementById("bilateralFilter");


// --------------------------------------------------
// GET ALL UPLOADED IMAGE DATA
// --------------------------------------------------

function getAllOriginalImages() {

    // 5-image upload system se data lena
    if (
        typeof originalDataList !== "undefined" &&
        originalDataList.length > 0
    ) {

        return originalDataList;

    }


    // Single image fallback
    const originalImage =
        document.getElementById("originalImage");


    if (
        !originalImage ||
        !originalImage.src ||
        !originalImage.complete ||
        originalImage.naturalWidth === 0
    ) {

        alert("Please upload image(s) first.");

        return [];

    }


    const imageData =
        getImageDataForFilter(
            originalImage
        );


    return imageData
        ? [imageData]
        : [];

}


// --------------------------------------------------
// GET IMAGE DATA FROM IMAGE ELEMENT
// --------------------------------------------------

function getImageDataForFilter(image) {

    const canvas =
        document.createElement("canvas");

    const width =
        image.naturalWidth;

    const height =
        image.naturalHeight;


    if (!width || !height) {
        return null;
    }


    canvas.width =
        width;

    canvas.height =
        height;


    const context =
        canvas.getContext(
            "2d",
            {
                willReadFrequently: true
            }
        );


    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );


    return context.getImageData(
        0,
        0,
        width,
        height
    );

}


// --------------------------------------------------
// CREATE FILTER RESULT AREA
// --------------------------------------------------

function createFilterResultArea() {

    let container =
        document.getElementById(
            "batchFilterResults"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "batchFilterResults";


        container.style.display =
            "grid";


        container.style.gridTemplateColumns =
            "repeat(auto-fit, minmax(300px, 1fr))";


        container.style.gap =
            "20px";


        container.style.marginTop =
            "25px";


        // Put after existing filtered canvas
        if (filteredCanvas) {

            filteredCanvas.parentElement
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
// DISPLAY MULTIPLE FILTERED IMAGES
// --------------------------------------------------

function displayFilteredImages(
    imageDataList,
    message
) {

    if (!imageDataList ||
        imageDataList.length === 0) {

        return;

    }


    // Update filter name
    if (filterName) {

        filterName.textContent =
            message +
            " - " +
            imageDataList.length +
            " Image(s)";

    }


    // Hide old single canvas when multiple images
    if (
        filteredCanvas &&
        imageDataList.length > 1
    ) {

        filteredCanvas.style.display =
            "none";

    }


    // Single image
    if (
        filteredCanvas &&
        imageDataList.length === 1
    ) {

        filteredCanvas.style.display =
            "block";

        filteredCanvas.width =
            imageDataList[0].width;

        filteredCanvas.height =
            imageDataList[0].height;


        const context =
            filteredCanvas.getContext(
                "2d"
            );


        context.clearRect(
            0,
            0,
            filteredCanvas.width,
            filteredCanvas.height
        );


        context.putImageData(
            imageDataList[0],
            0,
            0
        );

    }


    // Create multiple result area
    const container =
        createFilterResultArea();


    // Create a card for every image
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


            const context =
                canvas.getContext(
                    "2d"
                );


            context.putImageData(
                imageData,
                0,
                0
            );


            const label =
                document.createElement("p");


            label.textContent =
                message;


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
// AVERAGE FILTER
// Kernel = 3 × 3
// --------------------------------------------------

function applyAverageFilter() {

    const images =
        getAllOriginalImages();


    if (images.length === 0) {
        return;
    }


    const results = [];


    images.forEach(
        function (imageData) {

            const data =
                imageData.data;

            const width =
                imageData.width;

            const height =
                imageData.height;


            const output =
                new Uint8ClampedArray(
                    data
                );


            for (
                let y = 1;
                y < height - 1;
                y++
            ) {

                for (
                    let x = 1;
                    x < width - 1;
                    x++
                ) {

                    for (
                        let c = 0;
                        c < 3;
                        c++
                    ) {

                        let sum = 0;


                        for (
                            let ky = -1;
                            ky <= 1;
                            ky++
                        ) {

                            for (
                                let kx = -1;
                                kx <= 1;
                                kx++
                            ) {

                                const index =
                                    (
                                        (y + ky) *
                                        width +
                                        (x + kx)
                                    ) * 4 + c;


                                sum +=
                                    data[index];

                            }

                        }


                        const index =
                            (
                                y * width + x
                            ) * 4 + c;


                        output[index] =
                            Math.round(
                                sum / 9
                            );

                    }

                }

            }


            // Preserve alpha
            for (
                let i = 3;
                i < data.length;
                i += 4
            ) {

                output[i] =
                    data[i];

            }


            results.push(
                new ImageData(
                    output,
                    width,
                    height
                )
            );

        }
    );


    displayFilteredImages(
        results,
        "Average Filter Applied (3 × 3)"
    );

}


// --------------------------------------------------
// GAUSSIAN FILTER
// Kernel = 3 × 3
// --------------------------------------------------

function applyGaussianFilter() {

    const images =
        getAllOriginalImages();


    if (images.length === 0) {
        return;
    }


    const results = [];


    const kernel = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1]
    ];


    images.forEach(
        function (imageData) {

            const data =
                imageData.data;

            const width =
                imageData.width;

            const height =
                imageData.height;


            const output =
                new Uint8ClampedArray(
                    data
                );


            for (
                let y = 1;
                y < height - 1;
                y++
            ) {

                for (
                    let x = 1;
                    x < width - 1;
                    x++
                ) {

                    for (
                        let c = 0;
                        c < 3;
                        c++
                    ) {

                        let sum = 0;


                        for (
                            let ky = -1;
                            ky <= 1;
                            ky++
                        ) {

                            for (
                                let kx = -1;
                                kx <= 1;
                                kx++
                            ) {

                                const index =
                                    (
                                        (y + ky) *
                                        width +
                                        (x + kx)
                                    ) * 4 + c;


                                sum +=
                                    data[index] *
                                    kernel[ky + 1][kx + 1];

                            }

                        }


                        const index =
                            (
                                y * width + x
                            ) * 4 + c;


                        output[index] =
                            Math.round(
                                sum / 16
                            );

                    }

                }

            }


            // Preserve alpha
            for (
                let i = 3;
                i < data.length;
                i += 4
            ) {

                output[i] =
                    data[i];

            }


            results.push(
                new ImageData(
                    output,
                    width,
                    height
                )
            );

        }
    );


    displayFilteredImages(
        results,
        "Gaussian Filter Applied (3 × 3)"
    );

}


// --------------------------------------------------
// MEDIAN FILTER
// Kernel = 3 × 3
// --------------------------------------------------

function applyMedianFilter() {

    const images =
        getAllOriginalImages();


    if (images.length === 0) {
        return;
    }


    const results = [];


    images.forEach(
        function (imageData) {

            const data =
                imageData.data;

            const width =
                imageData.width;

            const height =
                imageData.height;


            const output =
                new Uint8ClampedArray(
                    data
                );


            for (
                let y = 1;
                y < height - 1;
                y++
            ) {

                for (
                    let x = 1;
                    x < width - 1;
                    x++
                ) {

                    for (
                        let c = 0;
                        c < 3;
                        c++
                    ) {

                        const values = [];


                        for (
                            let ky = -1;
                            ky <= 1;
                            ky++
                        ) {

                            for (
                                let kx = -1;
                                kx <= 1;
                                kx++
                            ) {

                                const index =
                                    (
                                        (y + ky) *
                                        width +
                                        (x + kx)
                                    ) * 4 + c;


                                values.push(
                                    data[index]
                                );

                            }

                        }


                        values.sort(
                            (a, b) => a - b
                        );


                        const index =
                            (
                                y * width + x
                            ) * 4 + c;


                        output[index] =
                            values[4];

                    }

                }

            }


            // Preserve alpha
            for (
                let i = 3;
                i < data.length;
                i += 4
            ) {

                output[i] =
                    data[i];

            }


            results.push(
                new ImageData(
                    output,
                    width,
                    height
                )
            );

        }
    );


    displayFilteredImages(
        results,
        "Median Filter Applied (3 × 3)"
    );

}


// --------------------------------------------------
// BILATERAL FILTER
// Kernel = 3 × 3
// --------------------------------------------------

function applyBilateralFilter() {

    const images =
        getAllOriginalImages();


    if (images.length === 0) {
        return;
    }


    const results = [];


    const sigmaSpatial = 2;
    const sigmaColor = 30;


    images.forEach(
        function (imageData) {

            const data =
                imageData.data;

            const width =
                imageData.width;

            const height =
                imageData.height;


            const output =
                new Uint8ClampedArray(
                    data
                );


            for (
                let y = 1;
                y < height - 1;
                y++
            ) {

                for (
                    let x = 1;
                    x < width - 1;
                    x++
                ) {

                    for (
                        let c = 0;
                        c < 3;
                        c++
                    ) {

                        let weightedSum = 0;
                        let weightSum = 0;


                        const centerIndex =
                            (
                                y * width + x
                            ) * 4 + c;


                        const centerValue =
                            data[centerIndex];


                        for (
                            let ky = -1;
                            ky <= 1;
                            ky++
                        ) {

                            for (
                                let kx = -1;
                                kx <= 1;
                                kx++
                            ) {

                                const index =
                                    (
                                        (y + ky) *
                                        width +
                                        (x + kx)
                                    ) * 4 + c;


                                const neighborValue =
                                    data[index];


                                const spatialDistance =
                                    kx * kx +
                                    ky * ky;


                                const colorDifference =
                                    neighborValue -
                                    centerValue;


                                const colorDistance =
                                    colorDifference *
                                    colorDifference;


                                const spatialWeight =
                                    Math.exp(
                                        -spatialDistance /
                                        (
                                            2 *
                                            sigmaSpatial *
                                            sigmaSpatial
                                        )
                                    );


                                const colorWeight =
                                    Math.exp(
                                        -colorDistance /
                                        (
                                            2 *
                                            sigmaColor *
                                            sigmaColor
                                        )
                                    );


                                const weight =
                                    spatialWeight *
                                    colorWeight;


                                weightedSum +=
                                    neighborValue *
                                    weight;


                                weightSum +=
                                    weight;

                            }

                        }


                        const index =
                            (
                                y * width + x
                            ) * 4 + c;


                        if (weightSum > 0) {

                            output[index] =
                                Math.round(
                                    weightedSum /
                                    weightSum
                                );

                        }
                        else {

                            output[index] =
                                centerValue;

                        }

                    }

                }

            }


            // Preserve alpha
            for (
                let i = 3;
                i < data.length;
                i += 4
            ) {

                output[i] =
                    data[i];

            }


            results.push(
                new ImageData(
                    output,
                    width,
                    height
                )
            );

        }
    );


    displayFilteredImages(
        results,
        "Bilateral Filter Applied (3 × 3)"
    );

}


// --------------------------------------------------
// BUTTON EVENTS
// --------------------------------------------------

if (averageButton) {

    averageButton.addEventListener(
        "click",
        applyAverageFilter
    );

}


if (gaussianButton) {

    gaussianButton.addEventListener(
        "click",
        applyGaussianFilter
    );

}


if (medianButton) {

    medianButton.addEventListener(
        "click",
        applyMedianFilter
    );

}


if (bilateralButton) {

    bilateralButton.addEventListener(
        "click",
        applyBilateralFilter
    );

}