const imageInput = document.getElementById("imageInput");

const originalImage = document.getElementById("originalImage");
const compressedImage = document.getElementById("compressedImage");

const originalSize = document.getElementById("originalSize");
const compressedSize = document.getElementById("compressedSize");
const compressionRatio = document.getElementById("compressionRatio");
const sizeReduction = document.getElementById("sizeReduction");

const mseElement = document.getElementById("mse");
const psnrElement = document.getElementById("psnr");
const ssimElement = document.getElementById("ssim");

const processingTime = document.getElementById("processingTime");


// =============================
// STORE ALL IMAGE DATA
// =============================

let originalDataList = [];
let compressedDataList = [];


// =============================
// STORE PERFORMANCE DATA
// =============================

let performanceResults = [];


// =============================
// IMAGE UPLOAD
// =============================

imageInput.addEventListener(
    "change",
    async function () {

        const files =
            Array.from(imageInput.files);


        if (files.length === 0) {
            return;
        }


        // Maximum 5 images
        if (files.length > 5) {

            alert(
                "Please select maximum 5 images."
            );

            imageInput.value = "";

            return;
        }


        // Reset old data
        originalDataList = [];

        compressedDataList = [];

        performanceResults = [];


        // =============================
        // CREATE / CLEAR BATCH RESULTS
        // =============================

        let batchResults =
            document.getElementById(
                "batchResults"
            );


        if (!batchResults) {

    batchResults =
        document.createElement("div");

    batchResults.id =
        "batchResults";

    batchResults.style.display =
        "flex";

    batchResults.style.flexDirection =
        "row";

    batchResults.style.flexWrap =
        "nowrap";

    batchResults.style.gap =
        "20px";

    batchResults.style.marginTop =
        "30px";

    batchResults.style.overflowX =
        "auto";

    batchResults.style.alignItems =
        "stretch";

    batchResults.style.paddingBottom =
        "15px";

    imageInput.parentElement.appendChild(
        batchResults
    );

}
        batchResults.innerHTML = "";


        // =============================
        // REMOVE OLD PERFORMANCE TABLE
        // =============================

        const oldPerformance =
            document.getElementById(
                "batchPerformance"
            );


        if (oldPerformance) {

            oldPerformance.remove();

        }


        // =============================
        // PROCESS ALL IMAGES
        // =============================

        for (
            let i = 0;
            i < files.length;
            i++
        ) {

            await processImage(
                files[i],
                i + 1,
                batchResults
            );

        }


        // =============================
        // COMBINED ORIGINAL HISTOGRAM
        // =============================

        if (
            originalDataList.length > 0
        ) {

            drawCombinedHistogram(
                originalDataList,
                "originalHistogram"
            );

        }


        // =============================
        // COMBINED COMPRESSED HISTOGRAM
        // =============================

        if (
            compressedDataList.length > 0
        ) {

            drawCombinedHistogram(
                compressedDataList,
                "compressedHistogram"
            );

        }


        // =============================
        // CREATE PERFORMANCE TABLE
        // =============================

        createPerformanceTable(
            performanceResults
        );

    }
);


// =============================
// PROCESS ONE IMAGE
// =============================

async function processImage(
    file,
    imageNumber,
    batchResults
) {

    try {

        // -----------------------------
        // ORIGINAL IMAGE
        // -----------------------------

        const originalURL =
            URL.createObjectURL(file);


        originalImage.src =
            originalURL;


        // -----------------------------
        // SEND IMAGE TO FLASK
        // -----------------------------

        const formData =
            new FormData();


        formData.append(
            "image",
            file
        );


        const response =
            await fetch(
                "http://127.0.0.1:5000/compress",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Server response error"
            );

        }


        const data =
            await response.json();


        if (data.error) {

            alert(
                data.error
            );

            return;
        }


        // -----------------------------
        // COMPRESSED IMAGE
        // -----------------------------

        compressedImage.src =
            data.image;


        processingTime.textContent =
            data.processing_time +
            " seconds";


        // -----------------------------
        // WAIT FOR IMAGE LOAD
        // -----------------------------

        await loadImage(
            originalImage
        );


        await loadImage(
            compressedImage
        );


        // -----------------------------
        // FILE SIZE
        // -----------------------------

        const originalBytes =
            file.size;


        const base64Data =
            data.image.split(",")[1];


        const compressedBytes =
            Math.ceil(
                base64Data.length * 3 / 4
            );


        const originalKB =
            originalBytes / 1024;


        const compressedKB =
            compressedBytes / 1024;


        // -----------------------------
        // COMPRESSION RATIO
        // -----------------------------

        const ratio =
            originalBytes /
            compressedBytes;


        // -----------------------------
        // SIZE REDUCTION
        // -----------------------------

        const reduction =
            (
                (originalBytes - compressedBytes) /
                originalBytes
            ) * 100;


        // -----------------------------
        // IMAGE DATA
        // -----------------------------

        const originalData =
            getImageData(
                originalImage
            );


        const compressedData =
            getImageData(
                compressedImage
            );


        // -----------------------------
        // STORE DATA FOR HISTOGRAM
        // -----------------------------

        originalDataList.push(
            originalData
        );


        compressedDataList.push(
            compressedData
        );


        // -----------------------------
        // CALCULATE METRICS
        // -----------------------------

        const metrics =
            calculateMetrics(
                originalData,
                compressedData
            );


        // -----------------------------
        // STORE PERFORMANCE RESULT
        // -----------------------------

        performanceResults.push({

            image:
                "Image " +
                imageNumber,

            fileName:
                file.name,

            originalSize:
                originalKB,

            compressedSize:
                compressedKB,

            ratio:
                ratio,

            reduction:
                reduction,

            mse:
                metrics.mse,

            psnr:
                metrics.psnr,

            ssim:
                metrics.ssim,

            processingTime:
                data.processing_time

        });


        // -----------------------------
        // UPDATE MAIN RESULT
        // -----------------------------

        originalSize.textContent =
            originalKB.toFixed(2) +
            " KB";


        compressedSize.textContent =
            compressedKB.toFixed(2) +
            " KB";


        compressionRatio.textContent =
            ratio.toFixed(2) +
            " : 1";


        sizeReduction.textContent =
            reduction.toFixed(2) +
            "%";


        mseElement.textContent =
            metrics.mse.toFixed(4);


        psnrElement.textContent =
            metrics.psnr === Infinity
                ? "∞ dB"
                : metrics.psnr.toFixed(2) +
                  " dB";


        ssimElement.textContent =
            metrics.ssim.toFixed(4);


        // -----------------------------
        // CREATE RESULT CARD
        // -----------------------------

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


        card.innerHTML = `

            <h3 style="margin-bottom:15px;">
                Image ${imageNumber}: ${file.name}
            </h3>

            <div style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
            ">

                <div style="
                    flex:1;
                    min-width:120px;
                ">

                    <h4>Original</h4>

                    <img
                        src="${originalURL}"
                        style="
                            width:100%;
                            max-height:220px;
                            object-fit:contain;
                            border-radius:8px;
                        "
                    >

                </div>


                <div style="
                    flex:1;
                    min-width:120px;
                ">

                    <h4>Compressed</h4>

                    <img
                        src="${data.image}"
                        style="
                            width:100%;
                            max-height:220px;
                            object-fit:contain;
                            border-radius:8px;
                        "
                    >

                </div>

            </div>

            <hr>

            <p>
                <b>Original Size:</b>
                ${originalKB.toFixed(2)} KB
            </p>

            <p>
                <b>Compressed Size:</b>
                ${compressedKB.toFixed(2)} KB
            </p>

            <p>
                <b>Compression Ratio:</b>
                ${ratio.toFixed(2)} : 1
            </p>

            <p>
                <b>Size Reduction:</b>
                ${reduction.toFixed(2)}%
            </p>

            <p>
                <b>MSE:</b>
                ${metrics.mse.toFixed(4)}
            </p>

            <p>
                <b>PSNR:</b>
                ${
                    metrics.psnr === Infinity
                    ? "∞ dB"
                    : metrics.psnr.toFixed(2) + " dB"
                }
            </p>

            <p>
                <b>SSIM:</b>
                ${metrics.ssim.toFixed(4)}
            </p>

            <p>
                <b>Processing Time:</b>
                ${data.processing_time} seconds
            </p>

        `;


        batchResults.appendChild(
            card
        );

    }

    catch (error) {

        console.error(error);

        alert(
            "Python server se connection nahi ho raha."
        );

    }

}


// =============================
// PERFORMANCE TABLE
// =============================

function createPerformanceTable(
    results
) {

    if (
        !results ||
        results.length === 0
    ) {

        return;
    }


    // -----------------------------
    // GET PERFORMANCE SECTION
    // -----------------------------

    const performanceSection =
        document.getElementById(
            "performance"
        );


    if (!performanceSection) {

        console.error(
            "Performance section not found."
        );

        return;
    }


    // -----------------------------
    // REMOVE OLD GENERATED TABLE
    // -----------------------------

    const oldTable =
        document.getElementById(
            "batchPerformance"
        );


    if (oldTable) {

        oldTable.remove();

    }


    // -----------------------------
    // CREATE TABLE CONTAINER
    // -----------------------------

    const container =
        document.createElement("div");


    container.id =
        "batchPerformance";


    container.style.marginTop =
        "20px";


    container.style.width =
        "100%";


    container.innerHTML = `

        <div style="
            overflow-x:auto;
        ">

            <table style="
                width:100%;
                border-collapse:collapse;
                min-width:900px;
                background:#ffffff;
            ">

                <thead>

                    <tr>

                        <th style="
                            border:1px solid #ddd;
                            padding:12px;
                            background:#245783;
                            color:white;
                        ">
                            Metric
                        </th>

                        ${results.map(
                            result => `

                            <th style="
                                border:1px solid #ddd;
                                padding:12px;
                                background:#245783;
                                color:white;
                            ">
                                ${result.image}
                            </th>

                        `
                        ).join("")}

                    </tr>

                </thead>


                <tbody>

                    <!-- Original Size -->

                    <tr>

                        <td style="
                            border:1px solid #ddd;
                            padding:10px;
                        ">
                            Original Size
                        </td>

                        ${results.map(
                            result => `

                            <td style="
                                border:1px solid #ddd;
                                padding:10px;
                                text-align:center;
                            ">
                                ${result.originalSize.toFixed(2)} KB
                            </td>

                        `
                        ).join("")}

                    </tr>


                    <!-- Compressed Size -->

                    <tr>

                        <td style="
                            border:1px solid #ddd;
                            padding:10px;
                        ">
                            Compressed Size
                        </td>

                        ${results.map(
                            result => `

                            <td style="
                                border:1px solid #ddd;
                                padding:10px;
                                text-align:center;
                            ">
                                ${result.compressedSize.toFixed(2)} KB
                            </td>

                        `
                        ).join("")}

                    </tr>


                    <!-- Compression Ratio -->

                    <tr>

                        <td style="
                            border:1px solid #ddd;
                            padding:10px;
                        ">
                            Compression Ratio
                        </td>

                        ${results.map(
                            result => `

                            <td style="
                                border:1px solid #ddd;
                                padding:10px;
                                text-align:center;
                            ">
                                ${result.ratio.toFixed(2)} : 1
                            </td>

                        `
                        ).join("")}

                    </tr>


                    <!-- Size Reduction -->

                    <tr>

                        <td style="
                            border:1px solid #ddd;
                            padding:10px;
                        ">
                            Size Reduction
                        </td>

                        ${results.map(
                            result => `

                            <td style="
                                border:1px solid #ddd;
                                padding:10px;
                                text-align:center;
                            ">
                                ${result.reduction.toFixed(2)}%
                            </td>

                        `
                        ).join("")}

                    </tr>


                    <!-- MSE -->

                    <tr>

                        <td style="
                            border:1px solid #ddd;
                            padding:10px;
                        ">
                            MSE
                        </td>

                        ${results.map(
                            result => `

                            <td style="
                                border:1px solid #ddd;
                                padding:10px;
                                text-align:center;
                            ">
                                ${result.mse.toFixed(4)}
                            </td>

                        `
                        ).join("")}

                    </tr>


                    <!-- PSNR -->

                    <tr>

                        <td style="
                            border:1px solid #ddd;
                            padding:10px;
                        ">
                            PSNR
                        </td>

                        ${results.map(
                            result => `

                            <td style="
                                border:1px solid #ddd;
                                padding:10px;
                                text-align:center;
                            ">
                                ${
                                    result.psnr === Infinity
                                    ? "∞ dB"
                                    : result.psnr.toFixed(2) + " dB"
                                }
                            </td>

                        `
                        ).join("")}

                    </tr>


                    <!-- SSIM -->

                    <tr>

                        <td style="
                            border:1px solid #ddd;
                            padding:10px;
                        ">
                            SSIM
                        </td>

                        ${results.map(
                            result => `

                            <td style="
                                border:1px solid #ddd;
                                padding:10px;
                                text-align:center;
                            ">
                                ${result.ssim.toFixed(4)}
                            </td>

                        `
                        ).join("")}

                    </tr>


                    <!-- Processing Time -->

                    <tr>

                        <td style="
                            border:1px solid #ddd;
                            padding:10px;
                        ">
                            Processing Time
                        </td>

                        ${results.map(
                            result => `

                            <td style="
                                border:1px solid #ddd;
                                padding:10px;
                                text-align:center;
                            ">
                                ${result.processingTime} sec
                            </td>

                        `
                        ).join("")}

                    </tr>

                </tbody>

            </table>

        </div>

    `;


    // -----------------------------
    // PUT TABLE INSIDE PERFORMANCE
    // SECTION
    // -----------------------------

    performanceSection.appendChild(
        container
    );

}


// =============================
// LOAD IMAGE
// =============================

function loadImage(image) {

    return new Promise(
        function (resolve, reject) {

            if (
                image.complete &&
                image.naturalWidth > 0
            ) {

                resolve();

                return;

            }


            image.onload =
                resolve;


            image.onerror =
                function () {

                    reject(
                        new Error(
                            "Image loading failed"
                        )
                    );

                };

        }
    );

}


// =============================
// GET IMAGE PIXELS
// =============================

function getImageData(image) {

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        image.naturalWidth;


    canvas.height =
        image.naturalHeight;


    const context =
        canvas.getContext(
            "2d"
        );


    context.drawImage(
        image,
        0,
        0
    );


    return context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

}