// -----------------------------
// IMAGE METRICS
// -----------------------------

function calculateMetrics(
    original,
    compressed
) {

    const length =
        Math.min(
            original.data.length,
            compressed.data.length
        );

    let mse = 0;

    let meanOriginal = 0;
    let meanCompressed = 0;

    let count = 0;


    // -----------------------------
    // MSE
    // -----------------------------

    for (
        let i = 0;
        i < length;
        i += 4
    ) {

        const originalGray =
            0.299 * original.data[i] +
            0.587 * original.data[i + 1] +
            0.114 * original.data[i + 2];

        const compressedGray =
            0.299 * compressed.data[i] +
            0.587 * compressed.data[i + 1] +
            0.114 * compressed.data[i + 2];


        const difference =
            originalGray - compressedGray;

        mse += difference * difference;

        meanOriginal += originalGray;
        meanCompressed += compressedGray;

        count++;
    }


    mse =
        mse / count;


    meanOriginal =
        meanOriginal / count;

    meanCompressed =
        meanCompressed / count;


    // -----------------------------
    // PSNR
    // -----------------------------

    let psnr;

    if (mse === 0) {

        psnr = Infinity;

    }
    else {

        psnr =
            10 * Math.log10(
                (255 * 255) / mse
            );

    }


    // -----------------------------
    // SSIM
    // -----------------------------

    let varianceOriginal = 0;
    let varianceCompressed = 0;
    let covariance = 0;


    for (
        let i = 0;
        i < length;
        i += 4
    ) {

        const originalGray =
            0.299 * original.data[i] +
            0.587 * original.data[i + 1] +
            0.114 * original.data[i + 2];

        const compressedGray =
            0.299 * compressed.data[i] +
            0.587 * compressed.data[i + 1] +
            0.114 * compressed.data[i + 2];


        varianceOriginal +=
            Math.pow(
                originalGray - meanOriginal,
                2
            );


        varianceCompressed +=
            Math.pow(
                compressedGray - meanCompressed,
                2
            );


        covariance +=
            (originalGray - meanOriginal) *
            (compressedGray - meanCompressed);

    }


    varianceOriginal =
        varianceOriginal / count;

    varianceCompressed =
        varianceCompressed / count;

    covariance =
        covariance / count;


    const C1 =
        Math.pow(0.01 * 255, 2);

    const C2 =
        Math.pow(0.03 * 255, 2);


    const ssim =
        (
            (2 * meanOriginal * meanCompressed + C1) *
            (2 * covariance + C2)
        )
        /
        (
            (meanOriginal * meanOriginal +
            meanCompressed * meanCompressed + C1)
            *
            (varianceOriginal +
            varianceCompressed + C2)
        );


    return {
        mse: mse,
        psnr: psnr,
        ssim: ssim
    };

}
