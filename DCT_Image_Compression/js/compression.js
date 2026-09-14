// -----------------------------
// COMPRESSION HELPERS
// -----------------------------

function calculateCompressionRatio(
    originalBytes,
    compressedBytes
) {

    if (compressedBytes <= 0) {
        return 0;
    }

    return originalBytes / compressedBytes;
}


function calculateSizeReduction(
    originalBytes,
    compressedBytes
) {

    if (originalBytes <= 0) {
        return 0;
    }

    return (
        (originalBytes - compressedBytes)
        / originalBytes
    ) * 100;

}


// Convert Base64 image to approximate byte size
function getBase64Size(base64String) {

    if (!base64String) {
        return 0;
    }

    const base64Data =
        base64String.includes(",")
            ? base64String.split(",")[1]
            : base64String;


    const padding =
        (base64Data.match(/=*$/) || [""])[0].length;


    return Math.floor(
        base64Data.length * 3 / 4
    ) - padding;

}
