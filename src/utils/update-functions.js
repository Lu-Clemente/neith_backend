function isValidAndDiferentValue(input, persisted) {
    return input !== null && input !== undefined && input !== persisted;
}

function putChangeValue(oldValue, newValue) {
    const isValidAndDifferentValue = isValidAndDiferentValue(newValue, oldValue);
    if (isValidAndDifferentValue) return newValue;

    return oldValue;
}

function arrayEquals(oldValue, newValue) {
    if (!newValue) return oldValue;

    if (oldValue.length != newValue.length) return newValue;
    if (oldValue.some((item, index) => item != newValue[index])) return newValue;

    return oldValue;
}

module.exports = {
    isValidAndDiferentValue,
    putChangeValue,
    arrayEquals,
};
