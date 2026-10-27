const canvas = document.getElementById('coordinate-plane');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;
const centerX= width/2;
const centerY= height/2;
const R = 3;
const scale = 110;
let NUMBER = 0;
const API_URL = '/fcgi-bin/';
let points = [];

function toCanvasX(x){
    return centerX + x*scale;
}

function toCanvasY(y){
    return centerY - y*scale;
}

function drawCanvas(R) {
    const color = 'rgba(52,152,219,0.7)'
    ctx.fillStyle = color;
    ctx.fillRect(
        toCanvasX(-R),
        toCanvasY(0),
        R * scale,
        R * scale
    );

    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(0));
    ctx.lineTo(toCanvasX(-R), toCanvasY(0));
    ctx.lineTo(toCanvasX(0), toCanvasY(R / 2));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(0));
    ctx.lineTo(toCanvasX(R), toCanvasY(0));
    ctx.arc(
        toCanvasX(0),
        toCanvasY(0),
        R * scale,
        0,
        -Math.PI / 2,
        true
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width - 20, centerY - 10);
    ctx.lineTo(width, centerY);
    ctx.lineTo(width - 20, centerY + 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - 10, 20);
    ctx.lineTo(centerX, 0);
    ctx.lineTo(centerX + 10, 20);
    ctx.stroke();


    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('X', width - 20, centerY - 20);
    ctx.fillText('Y', centerX - 20, 40);
    const xMarks = [-R, -R / 2, R / 2, R];
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';

    xMarks.forEach(function (x) {
        const canvasX = toCanvasX(x);
        ctx.beginPath();
        ctx.moveTo(canvasX, centerY - 10);
        ctx.lineTo(canvasX, centerY + 10);
        ctx.stroke();

        let label;
        if (x === -R) label = '-R';
        else if (x === -R / 2) label = '-R/2';
        else if (x === R) label = 'R';
        else label = 'R/2';

        ctx.fillText(label, canvasX, centerY + 40);
    });
    const yMarks = [-R, -R / 2, R / 2, R];
    ctx.textAlign = 'right';

    yMarks.forEach(function (y) {
        const canvasY = toCanvasY(y);

        ctx.beginPath();
        ctx.moveTo(centerX - 10, canvasY);
        ctx.lineTo(centerX + 10, canvasY);
        ctx.stroke();

        let label = y;
        if (y === -R) label = '-R';
        else if (y === -R / 2) label = '-R/2';
        else if (y === R / 2) label = 'R/2';
        else if (y === R) label = 'R';

        ctx.fillText(label, centerX - 20, canvasY + 10);
    });
}

drawCanvas(R);
drawAllPoints(R);

async function request(method, params) {
    const options = { method, cache: 'no-store' };
    if (method === 'POST') {
        options.body = new URLSearchParams(params);
    }
    const response = await fetch(API_URL, options);
    const rawText = await response.text();
    let data;
    try {
        data = JSON.parse(rawText);
    } catch (e) {
        throw new Error(`Сервер вернул некорректные данные. Статус: ${response.status}. Ответ: ${rawText}`);
    }
    if (!response.ok) {
        const message = Array.isArray(data?.errors)
            ? data.errors.join('\n')
            : `HTTP ошибка: ${response.status}`;
        throw new Error(message);
    }
    return data;
}

function showResult(data){
    ctx.clearRect(0, 0, width, height);
    drawCanvas(data.r);
    drawPoint(data.x, data.y, data.isHit);
    drawAllPoints(data.r);
    points.push(data);
    document.getElementById('results-body').appendChild(createResultRow(data));
}

async function checkPoint(x,y,r){
    try {
        showResult(await request('POST', { x, y, r }));
    } catch (error){
        console.error('Ошибка запроса:', error);
        alert(`Ошибка: ${error.message}`);
    }
}
async function loadFromServer() {
    try {
        const data = await request('GET');
        points = data.results;
        const tbody = document.getElementById('results-body');
        tbody.innerHTML = '';
        NUMBER = 0;
        points.forEach(item => tbody.appendChild(createResultRow(item)));
    } catch (error) {
        console.error('Не удалось загрузить результаты с сервера:', error);
    }
}
async function submitForm(event){
    event.preventDefault();
    clearErrors();
    const x = getRadioValue('x');
    const y = document.getElementById('y-input').value.trim();
    const r = getRadioValue('r');

    const error_map = new Map();

    if (x ===null){
        error_map.set('x-error', "Выберите значение Х");
    }
    if (x === 'multiple') {
        error_map.set('x-error', "Выберите только одно значение X (не несколько)");
    }
    if (y === '') {
        error_map.set('y-error', 'Введите значение Y');
    }
    const yRegex = /^-?\d+([.,]\d+)?$/;
    if (!yRegex.test(y)) {
        error_map.set('y-error', 'Y должен быть числом (например: 2, -1.5, 0)');
    }

    const yNum = parseFloat(y.replace(',', '.'));
    if (yNum < -3 || yNum > 3) {
        error_map.set('y-error', 'Y должен быть от -3 до 3');
    }

    if (r === null) {
        error_map.set('r-error', 'Выберите значение R');
    }
    if (r === 'multiple') {
        error_map.set('r-error', "Выберите только одно значение R (не несколько)");
    }
    if (error_map.size>0){
        for ([elem, err] of error_map){
            showError(elem, err);
        }
        return;
    }
    await checkPoint(parseFloat(x), yNum, parseFloat(r));
}
function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

function checkHit(x, y, R) {
    const inRectangle = (x >= -R && x <= 0) && (y >= -R && y <= 0);
    const inTriangle = (x >= -R && x <= 0) && (y >= 0) && (y <= x / 2 + R / 2);
    const inCircle = (x >= 0 && x <= R) && (y >= 0 && y <= R) && (x * x + y * y <= R * R);
    return inRectangle || inCircle || inTriangle;
}

// function getSelectedCheckboxValue(name){
//     const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
//     if (checked.length === 0) return null;
//     if (checked.length>1){
//         return 'multiple';
//     }
//     return checked[0].value;
// }

function showError(elementId, message){
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
}

function clearErrors(){
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(function(element){
        element.textContent='';
    });
}

function drawPoint(x, y, isHit) {
    const canvasX = toCanvasX(x);
    const canvasY = toCanvasY(y);

    ctx.fillStyle = isHit ? '#27ae60' : '#e74c3c';

    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 12, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    return true;
}

// function saveToLocalStorage(result){
//     try{
//         const results = JSON.parse(localStorage.getItem('pointResults')|| '[]');
//         results.push(result);
//         localStorage.setItem('pointResults', JSON.stringify(results));
//     }catch (e) {
//         console.error('Ошибка при сохранении в LocalStorage:', e);
//     }
// }
//
// function loadFromLocalStorage(){
//     try {
//         const results = JSON.parse(localStorage.getItem('pointResults')|| '[]');
//         const tbody = document.getElementById('results-body');
//         tbody.innerHTML = '';
//
//         results.forEach(item =>{
//             const row = createResultRow(item);
//             tbody.appendChild(row);
//         });
//     }catch (e) {
//         console.error('Ошибка при загрузке из LocalStorage:', e);
//     }
// }

function createResultRow(item) {
    let n = NUMBER++;
    const row = document.createElement('tr');
    row.setAttribute('number', n.toString());
    const cellX = document.createElement('td');
    cellX.textContent = item.x;
    const cellY = document.createElement('td');
    cellY.textContent = item.y;
    const cellR = document.createElement('td');
    cellR.textContent = item.r;
    const cellResult = document.createElement('td');
    cellResult.textContent = item.isHit ? 'Попала' : 'Не попала';
    cellResult.className = item.isHit ? 'hit' : 'miss';
    const cellTime = document.createElement('td');
    cellTime.setAttribute('data-timestamp', item.currentTime);
    cellTime.textContent = formatTimeToCurrentZone(item.currentTime);
    const cellExec = document.createElement('td');
    cellExec.textContent = item.executionTime + ' мс';
    row.append(cellX, cellY, cellR, cellResult, cellTime, cellExec);
    return row;
}

function formatTimeToCurrentZone(isoString) {
    const date = new Date(isoString);
    if (isNaN(date.getDate())) return isoString;

    const datePart = date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const timePart = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return `${datePart}\n${timePart}`;
}

function getZoneKey() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone + '|' + new Date().getTimezoneOffset();
}

let currentZoneKey = getZoneKey();
setInterval(() => {
    const newKey = getZoneKey();
    if (newKey !== currentZoneKey) {
        currentZoneKey = newKey;
        refreshAllTimeDisplays();
    }
}, 1000);

function refreshAllTimeDisplays() {
    const timeCells = document.querySelectorAll('td[data-timestamp]');
    timeCells.forEach(cell => {
        const isoString = cell.getAttribute('data-timestamp');
        cell.textContent = formatTimeToCurrentZone(isoString);
    });
}


document.getElementById('clear-btn').addEventListener('click', async () => {
    const tbody = document.getElementById("results-body");
    if (tbody.childElementCount === 0) {
        alert("Чтобы что-то удалить, надо это сделать сначала)");
        return;
    }
    if (!confirm('Вы уверены, что хотите удалить все результаты?')) return;
    try {
        await request('DELETE');
        tbody.innerHTML = '';
        NUMBER = 0;
        points = [];
        ctx.clearRect(0, 0, width, height);
        drawCanvas(parseFloat(getRadioValue('r')) || R);
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
});

function makeCheckboxesExclusive(groupName) {
    const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
    if (checkboxes.length === 0) {
        console.warn(`Группа чекбоксов "${groupName}" не найдена`);
        return false;
    }
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                checkboxes.forEach(other => {
                    if (other !== this) {
                        other.checked = false;
                    }
                });
            }
        });
    });

    return true;
}
const checkboxes = document.querySelectorAll(`input[name="r"]`);
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            ctx.clearRect(0, 0, width, height);
            drawCanvas(parseFloat(checkbox.value));
            drawAllPoints(parseFloat(checkbox.value));
        }
    })
})
makeCheckboxesExclusive('x');

makeCheckboxesExclusive('r');

const form = document.getElementById('point-form');

form.addEventListener('submit', submitForm );

document.addEventListener('DOMContentLoaded', async () => {
    await loadFromServer();
    ctx.clearRect(0, 0, width, height);
    drawCanvas(R);
    drawAllPoints(R);
});

function getMathCoordinates(event) {
    const rect = canvas.getBoundingClientRect();

    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const internalX = pixelX * scaleX;
    const internalY = pixelY * scaleY;

    const mathX = (internalX - centerX) / scale;
    const mathY = (centerY - internalY) / scale;

    return { x: mathX, y: mathY };
}

async function addClickedPointToResults(event) {
    const { x, y } = getMathCoordinates(event);
    let r = getRadioValue('r');
    if (r === null || r === 'multiple') {
        r = '3';
        document.querySelector('input[name="r"][value="3"]').checked = true;
    }
    document.querySelectorAll('input[name="x"]').forEach((cb) => { cb.checked = false; });
    document.getElementById('y-input').value = y.toFixed(2).replace('.', ',');
    clearErrors();
    if (x < -5 || x > 3 || y <= -3 || y >= 3) {
        if (y <= -3 || y >= 3) {
            showError('y-error', 'Точка вне допустимой области: Y от -3 до 3');
        }
        if (x < -5 || x > 3){
            showError('x-error', 'Точка вне допустимой области: X от -5 до 3');
        }
        return;
    }
    await checkPoint(x.toFixed(2), y.toFixed(2), parseFloat(r));
}

function drawAllPoints(r){
    const len = points.length;
    if (len===0) return;
    let i = 0
    const setActive = (n, active) => {
        const tr = document.querySelector(`tr[number="${n}"]`);
        if (tr) tr.classList.toggle('row-active', active);
    };
    const intervalID = setInterval(() => {
        if (i < len) {
            const point = points[i];
            drawPoint(point.x, point.y, checkHit(point.x, point.y, r));
            setActive(i, true);
            setActive(i - 1, false);
            i++;
        } else {
            setActive(len - 1, false);
            clearInterval(intervalID);
        }
    }, 500);
}
canvas.addEventListener('click', addClickedPointToResults);
document.querySelectorAll('input[name="r"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.checked) {
            const newR = parseFloat(this.value);
            ctx.clearRect(0, 0, width, height);
            drawCanvas(newR);
            drawAllPoints(newR);
        }
    });
});