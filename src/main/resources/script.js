const canvas = document.getElementById('coordinate-plane');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;
const centerX= width/2;
const centerY= height/2;
const R = 3;
const scale = 110;
let NUMBER = 0;

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
        toCanvasX(0),
        toCanvasY(R/2),
        R * scale,
        R/2 * scale
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
    ctx.lineTo(toCanvasX(- R / 2), toCanvasY(0));
    ctx.arc(
        toCanvasX(0),
        toCanvasY(0),
        (R / 2) * scale,
        Math.PI,
        Math.PI / 2,
        true
    )
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

async function submitForm(event){
    event.preventDefault();
    clearErrors();
    const x = getSelectedCheckboxValue('x');
    const y = document.getElementById('y-input').value.trim();
    const r = getSelectedCheckboxValue('r');

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
    if (yNum < -3 || yNum > 5) {
        error_map.set('y-error', 'Y должен быть от -3 до 5');
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
    const xNum = parseFloat(x);
    const rNum = parseFloat(r);
    const queryString = `x=${xNum}&y=${yNum}&r=${rNum}`;
    const url = `/fcgi-bin/?${queryString}`;
    try{
        const  response = await fetch(url, {method:'GET'});
        if (!response.ok){
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error){
            alert("Server error: ", data.error+"in if in sub");
            return;
        }
        ctx.clearRect(0, 0, width, height);
        drawCanvas(parseFloat(data.r));
        drawPoint(parseFloat(data.x), parseFloat(data.y),data.isHit);
        drawAllPoints(rNum);

        const row =createResultRow(data);
        document.getElementById('results-body').appendChild(row);
        saveToLocalStorage(data);
    }catch (error){
        console.log("Error while sending:", error);
        alert("Server error: " + data.error+"in sub");
    }
}

function checkHit(x, y, R) {
    const inRectangle = (x >= 0 && x <= R) && (y >= 0 && y <= R / 2);
    const inTriangle = (x >= -R && x <= 0) && (y >= 0) && (y <= x / 2 + R / 2);
    const inCircle = (x <= 0 && y <= 0) && (x * x + y * y <= (R / 2) * (R / 2));
    return inRectangle || inCircle || inTriangle;
}

function getSelectedCheckboxValue(name){
    const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
    if (checked.length === 0) return null;
    if (checked.length>1){
        return 'multiple';
    }
    return checked[0].value;
}

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

function saveToLocalStorage(result){
    try{
        const results = JSON.parse(localStorage.getItem('pointResults')|| '[]');
        results.push(result);
        localStorage.setItem('pointResults', JSON.stringify(results));
    }catch (e) {
        console.error('Ошибка при сохранении в LocalStorage:', e);
    }
}

function loadFromLocalStorage(){
    try {
        const results = JSON.parse(localStorage.getItem('pointResults')|| '[]');
        const tbody = document.getElementById('results-body');
        tbody.innerHTML = '';

        results.forEach(item =>{
            const row = createResultRow(item);
            tbody.appendChild(row);
        });
    }catch (e) {
        console.error('Ошибка при загрузке из LocalStorage:', e);
    }
}

function createResultRow(item) {
    let n = NUMBER++;
    const row = document.createElement('tr');
    row.setAttribute('number', n);
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
    if (isNaN(date)) return isoString;
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
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

let currentSystemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

setInterval(() => {
    const newSystemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (newSystemTimeZone !== currentSystemTimeZone) {
        currentSystemTimeZone = newSystemTimeZone;
        refreshAllTimeDisplays();
    }
}, 5000);

document.getElementById('clear-btn').addEventListener('click', () => {
    const tbody = document.getElementById("results-body");
    if (tbody.childElementCount === 0) {
        alert("Чтобы что-то удалить, надо это сделать сначала)");
        return;
    }
    if (confirm('Вы уверены, что хотите удалить все результаты?')) {
        localStorage.removeItem('pointResults');
        document.getElementById('results-body').innerHTML = '';
        NUMBER = 0;
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

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    ctx.clearRect(0, 0, width, height);
    drawCanvas(R);
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
    let {x, y} = getMathCoordinates(event);
    x = x.toFixed(2);
    y = y.toFixed(2);

    let r = getSelectedCheckboxValue('r');
    if (r === null || r === 'multiple') {
        r = '3';
        document.querySelector('input[name="r"][value="3"]').checked = true;
    }
    const rNum = parseFloat(r);
    document.querySelectorAll('input[name="x"]').forEach(cb => cb.checked = false);
    document.getElementById('y-input').value = y.toString().replace('.', ',');
    clearErrors();
    const queryString = `x=${x}&y=${y}&r=${rNum}`;
    const url = `/fcgi-bin/?${queryString}`;
    try {
        const response = await fetch(url, {method: 'GET'});
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            alert("Server error: ", data.error +"in if");
            return;
        }
        ctx.clearRect(0, 0, width, height);
        drawCanvas(parseFloat(data.r));
        drawPoint(parseFloat(data.x), parseFloat(data.y), data.isHit);
        drawAllPoints(rNum);

        const row = createResultRow(data);
        document.getElementById('results-body').appendChild(row);
        saveToLocalStorage(data);
    }catch (error){
        console.log("Error while sending:", error);
        alert("Server error: " + data.error+"in cl");
    }
}

function drawAllPoints(r){
    const points = JSON.parse(localStorage.getItem('pointResults') || '[]');
    const len = points.length;
    if (len===0) return;
    let i = 0
    const setBg = (n, color) => {
        const tr = document.querySelector(`tr[number="${n}"]`);
        if (tr) tr.style.backgroundColor = color;
    };
    const intervalID = setInterval(() => {
        if (i < len) {
            const point = points[i];
            drawPoint(point.x, point.y, checkHit(point.x, point.y, r));
            setBg(i, '#000000');
            setBg(i - 1, '#ffffff');
            i++;
        } else {
            setBg(len - 1, '#ffffff');
            clearInterval(intervalID);
        }
    }, 500);
}
canvas.addEventListener('click', addClickedPointToResults);