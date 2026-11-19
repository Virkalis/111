// Дополнительные функции проекта без браузерных alert/confirm/prompt.
function showExternalMessage(target) {
    const message = 'Для покупок в интернет-магазине можно использовать банковскую карту.';
    if (target) target.textContent = message;
    return message;
}

function showVariables(target) {
    const values = {
        string: 'Строковая переменная',
        number: 100,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined
    };
    const message =
        'Строка: ' + typeof values.string + '\n' +
        'Число: ' + typeof values.number + '\n' +
        'Булево: ' + typeof values.boolean + '\n' +
        'Null: ' + typeof values.nullValue + '\n' +
        'Undefined: ' + typeof values.undefinedValue;
    if (target) target.textContent = message;
    return message;
}
