// -----------------------------
// HISTOGRAM
// -----------------------------

function getHistogram(imageData) {

    const histogram = new Array(256).fill(0);

    for (
        let i = 0;
        i < imageData.data.length;
        i += 4
    ) {

        const gray =
            Math.round(
                0.299 * imageData.data[i] +
                0.587 * imageData.data[i + 1] +
                0.114 * imageData.data[i + 2]
            );

        histogram[gray]++;
    }

    return histogram;
}


// -----------------------------
// SINGLE HISTOGRAM
// -----------------------------

function drawHistogram(imageData, canvasId) {

    drawCombinedHistogram(
        [imageData],
        canvasId
    );
}


// -----------------------------
// COMBINED HISTOGRAM
// -----------------------------

function drawCombinedHistogram(
    imageDataList,
    canvasId
) {

    const canvas =
        document.getElementById(canvasId);

    const context =
        canvas.getContext("2d");

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (imageDataList.length === 0) {
        return;
    }


    // Calculate all histograms
    const histograms =
        imageDataList.map(
            imageData => getHistogram(imageData)
        );


    // Find maximum value
    let maxValue = 0;

    histograms.forEach(histogram => {

        const currentMax =
            Math.max(...histogram);

        if (currentMax > maxValue) {
            maxValue = currentMax;
        }

    });


    // -----------------------------
    // DRAW EACH IMAGE HISTOGRAM
    // -----------------------------

    histograms.forEach((histogram, imageIndex) => {

        context.beginPath();

        for (
            let i = 0;
            i < 256;
            i++
        ) {

            const x =
                i *
                (canvas.width / 255);

            const y =
                canvas.height -
                (
                    histogram[i] /
                    maxValue
                ) *
                (canvas.height - 20);


            if (i === 0) {
                context.moveTo(x, y);
            }
            else {
                context.lineTo(x, y);
            }

        }

        context.stroke();
    });


    // -----------------------------
    // AXIS
    // -----------------------------

    context.beginPath();

    context.moveTo(
        0,
        canvas.height - 1
    );

    context.lineTo(
        canvas.width,
        canvas.height - 1
    );

    context.stroke();


    // -----------------------------
    // X-AXIS LABELS
    // -----------------------------

    context.font = "12px Arial";

    context.fillText(
        "0",
        5,
        canvas.height - 5
    );

    context.fillText(
        "128",
        canvas.width / 2 - 10,
        canvas.height - 5
    );

    context.fillText(
        "255",
        canvas.width - 25,
        canvas.height - 5
    );

}