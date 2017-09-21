let prevPercentage = 0;
let prevAmountDancing = 0;
let prevAmountTracked = 0;

function calculatePercentage(amountTracked, amountDancing, averageDeltaX, averageDeltaY) {
    let percentage = 0;

    let amountDancingDifference = amountDancing - prevAmountDancing ;

    switch (amountDancing) {
        case 0:
            percentage = -1;
            break;
        case 1:
            percentage = 0.5;
            break;
        case 2:
            percentage = 1;
            break;
        case 3:
            percentage = 1.5;
            break;
        case 4:
            percentage = 2;
            break;
        case 5:
            percentage = 2.5;
            break;
        case 6:
            percentage = 3.0;
            break;
        default:
            console.log('amountDancing Switch: default hit');
            percentage = 1;
    }

    percentage = percentage + (amountDancingDifference * 0.25);

    prevPercentage = percentage;
    prevAmountDancing = amountDancing;
    prevAmountTracked = amountTracked;

    return percentage;
}

module.exports = {
    calculatePercentage
}