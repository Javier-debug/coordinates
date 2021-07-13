const input = document.getElementById("input");
//const iniciar = document.getElementById("iniciar");
//const detener = document.getElementById("detener");
const progress1 = document.getElementById("progress1");
const progress2 = document.getElementById("progress2");
const lblFileName = document.getElementById("lblFileName");
const lblRegistros = document.getElementById("lblRegistros");
const lblCompletados= document.getElementById("lblCompletados");
const btnAgregarDatos = document.getElementById("btnAgregarDatos");
var geocoder = null
var reloaded = false;
//const Porcentaje = document.getElementById("Porcentaje");
const numb = document.querySelector(".number");
let counter = 0;
var myInterval = null;
var secondInterval = null;
var thirdInterval = null;
const loggedin = document.querySelectorAll(".logged-in");
const unlogged = document.querySelectorAll(".unlogged");
var salir = document.getElementById("salir");
const formaingresar = document.getElementById("formaingresar");
const btnIngresar = document.getElementById("btnIngresar");
var auth = firebase.auth();
var dataArray;
var total = 0;
var porc = 0; 
var count = 0;
var terminado = 0;
var wb = null;
var newExcelData = [];
var finished = 0;
var excelData = null;
//var i = 0;
//var j = 0;

checkStorage();

async function checkStorage() {
  if(sessionStorage.getItem('myArray') != null){
    finished = 0;
    total = sessionStorage.getItem('total');
    var ExcelString = sessionStorage.getItem('newExcelData').toString();
    var b = 0;
    var number = "";
    newExcelData.push([]);
    for (var a = 0; a < sessionStorage.getItem('newExcelData').length; a++) {
      if(sessionStorage.getItem('newExcelData')[a] != ";" && sessionStorage.getItem('newExcelData')[a] != ",")
      {
        number += sessionStorage.getItem('newExcelData')[a];
      }
      else {
        if (sessionStorage.getItem('newExcelData')[a] == ";") {
          newExcelData[b].push(number);
          number = "";
        }
        else {
          newExcelData[b].push(number);
          number = "";
          b++;
          if (a != sessionStorage.getItem('newExcelData').length - 1) {
            newExcelData.push([]);
          }
        }
      }
    }
    (sessionStorage.getItem('finished') != null) ? (finished = parseFloat(sessionStorage.getItem('finished'))) : (finished = 0)
    console.log(newExcelData.length + ", " + finished)
    ExcelString = sessionStorage.getItem('myArray')
    excelData = ExcelString.split(";");
    await new Promise(r => setTimeout(r, 10000));
    lblCompletados.style.display = "block";
    geocoder = new google.maps.Geocoder();
    myInterval = setInterval(myTimer, 50);
    //thirdInterval = setInterval(getCoord3, 1000)
    for (var a = finished; a < excelData.length - 1; a++) {
      var response = await getCoord4();
      if (response == false) {
        location.reload();
        return;
      }
      if (finished >= parseFloat(sessionStorage.getItem('total'))) {
        wb = XLSX.utils.book_new();
        wb.SheetNames.push("Hoja1")
        var finalArray = [];
        for (var z = 0; z < excelData.length - 1; z++) {
          finalArray.push([])
          finalArray[z].push(excelData[z])
          finalArray[z].push(newExcelData[z][0])
          finalArray[z].push(newExcelData[z][1])
        }
        var ws = XLSX.utils.aoa_to_sheet(finalArray);
        wb.Sheets["Hoja1"] = ws;
        var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'coordenadas.xlsx');
        sessionStorage.clear();
      }
    }
  }
}
console.log("Total: " + sessionStorage.getItem('total'))



auth.onAuthStateChanged(user => {
  if(user) {
    loggedin.forEach(item => item.style.display = "block");
    unlogged.forEach(item => item.style.display = "none");
  }
  else {
    loggedin.forEach(item => item.style.display = "none");
    unlogged.forEach(item => item.style.display = "block");
  }
});

salir.addEventListener("click", (e) => {
  e.preventDefault();
  auth.signOut()
})

btnIngresar.addEventListener("click", () => {
  let correo = formaingresar['correo'].value;
  let contrasenia = formaingresar['contraseña'].value;

  auth.signInWithEmailAndPassword(correo, contrasenia).then(credencial => {
    $('#ingresarModal').modal('hide');
    formaingresar.reset();
    formaingresar.querySelector('.error').innerHTML = ''
  }).catch(error => {
    formaingresar.querySelector('.error').innerHTML = mensajeError(error.code)
  });
})

function mensajeError(codigo) {
  let mensaje = '';
  switch(codigo) {
    case 'auth/wrong-password': 
    mensaje = "Contraseña incorrecta"
    break;
    case 'auth/user-not-found': 
    mensaje = "Usuario no encontrado"
    break;
    case 'auth/weak-password': 
    mensaje = "Contraseña debil"
    break;
    default: 
    mensaje = "Occurio un error al ingresar con este usuario"
  }
  return mensaje;
}


input.addEventListener("change", async function() {
  dataArray = [];
  total = 0;
  progress2.style.animation = "reloadLeft 0.1s linear both";
  progress2.style.animationPlayState = "running";
  progress1.style.animation = "reloadLeft 0.1s linear both";
  progress1.style.animationPlayState = "running";
  progress1.style.animationDelay = "0.1s"
  numb.textContent = "0%"

  lblFileName.innerHTML = input.files[0].name + ' <img src="./img/excel.png" width="25px" height="25px">'
  var arrayToText = ""
  await readXlsxFile(input.files[0], { getSheets: true }).then(async function(sheets) {
    for (var a = 0; a < sheets.length; a++) {
      dataArray.push([]);
      //var position = i - 1;
      await readXlsxFile(input.files[0], { sheet: a + 1 }).then(async function(sheetData) {
        for (var b = 0; b < sheetData.length; b++) {
          dataArray[a].push([sheetData[b][0]])
          arrayToText += sheetData[b][0].toString() + ";";
          total++;
        }
      })
    }
    sessionStorage.setItem('myArray', arrayToText);
    sessionStorage.setItem('total', total);
    //location.reload();
  })
  lblRegistros.innerText = "Registros detectados: " + total;
  lblRegistros.style.display = "block";
})

btnAgregarDatos.addEventListener("click", async () => {
  progress2.style.animation = "left 4s linear both";
  progress2.style.animationPlayState = "paused";
  progress1.style.animation = "right 4s linear both";
  progress1.style.animationPlayState = "paused";
  lblCompletados.style.display = "block";
  (sessionStorage.getItem('finished') != null) ? (finished = sessionStorage.getItem('finished')) : (finished = 0)
  excelData = sessionStorage.getItem('myArray').split(";");
  geocoder = new google.maps.Geocoder();
  myInterval = setInterval(myTimer, 50);
  for (var a = 0; a < excelData.length - 1; a++) {
    var response = await getCoord4();
    console.log(response)
    if (response == false) {
      location.reload();
      return;
    }
    if (finished >= parseFloat(sessionStorage.getItem('total'))) {
      wb = XLSX.utils.book_new();
      wb.SheetNames.push("Hoja1")
      var finalArray = [];
      for (var z = 0; z < excelData.length - 1; z++) {
        finalArray.push([])
        finalArray[z].push(excelData[z])
        finalArray[z].push(newExcelData[z][0])
        finalArray[z].push(newExcelData[z][1])
      }
      var ws = XLSX.utils.aoa_to_sheet(finalArray);
      wb.Sheets["Hoja1"] = ws;
      var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
      saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'coordenadas.xlsx');
      sessionStorage.clear();
    }
  }
  //thirdInterval = setInterval(getCoord3, 1000)
  //agregar();
})

function s2ab(s) { 
  var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  var view = new Uint8Array(buf);  //create uint8array as viewer
  for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
  return buf;    
}

async function agregar() {
  porc = 0; 
  count = 0;
  terminado = 0;
  console.log(dataArray[1].length)

  
  myInterval = setInterval(myTimer, 50);
  wb = XLSX.utils.book_new();
  geocoder = new google.maps.Geocoder();
  //wb.SheetNames.push("Hoja" + (i + 1));
  //thirdInterval = setInterval(getCoord2, 2000)
  
  for (var i = 0; i < dataArray.length; i++) {
    wb.SheetNames.push("Hoja" + (i + 1));
    for(var j = 0; j < dataArray[i].length; j++) {
      var ok = null;
      if (count % 200 == 0 && count != 0) {
        console.log("Alto de 5 minutos")
        await new Promise(r => setTimeout(r, 300000));
      }
      ok = await getCoord(i, j);
      console.log(ok);
      if (ok == null) {
        await new Promise(r => setTimeout(r, 30000));
        j--;
      }
      else {
        if (count == total - 1) {
          clearInterval(myInterval);
          progress2.style.animationPlayState = "running";
          lblCompletados.innerText = "Registros completados: " + (count + 1) + "/"+total;
          secondInterval = setInterval(secondTimer, 50);
        }  
      }
      //await new Promise(r => setTimeout(r, 1300));
    }
    var ws = XLSX.utils.aoa_to_sheet(dataArray[i]);
    wb.Sheets["Hoja" + (i + 1)] = ws;
  }
  

  var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
  saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'coordenadas.xlsx');
}

function getCoord(i, j) {
  return new Promise(resolve => {
    setTimeout(() => {
      try {
        console.log(count)
        geocoder.geocode( { 'address': dataArray[i][j][0]}, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
            var latitude = results[0].geometry.location.lat();
            var longitude = results[0].geometry.location.lng();
            dataArray[i][j].push(latitude);
            dataArray[i][j].push(longitude);
            count++;
            resolve(true);
          } 
          else if (status == "OVER_QUERY_LIMIT"){
            console.log(status)
            //dataArray[i][j].push(0);
            //count++;
            geocoder = new google.maps.Geocoder();
            resolve(null);
          }
        }); 
      }
      catch(error) {
        console.log("Error intento: " + count)
        console.log(error);
        count++;
        dataArray[i][j].push(0);
        if (count == total - 1) {
          clearInterval(myInterval);
          progress2.style.animationPlayState = "running";
          lblCompletados.innerText = "Registros completados: " + (count + 1) + "/"+total;
          secondInterval = setInterval(secondTimer, 50);
        }
        resolve(false);
      }
    }, 1000);
  });  
}

async function getCoord2 () {
  try {
    if (j > dataArray[i].length - 1) {
      var ws = XLSX.utils.aoa_to_sheet(dataArray[i]);
      wb.Sheets["Hoja" + (i + 1)] = ws;
      i++;
      wb.SheetNames.push("Hoja" + (i + 1));
      j = 0;
    }
    if (i > dataArray.length - 1) {
      wb.SheetNames.pop();
      console.log("Se guardara el archivo")
      var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
      saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'coordenadas.xlsx');
      clearInterval(thirdInterval);
    }
    else {
      await geocoder.geocode( { 'address': dataArray[i][j][0]}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
          var latitude = results[0].geometry.location.lat();
          var longitude = results[0].geometry.location.lng();
          dataArray[i][j].push(latitude);
          dataArray[i][j].push(longitude);
          count++;
          j++;
        } 
        else if (status == "OVER_QUERY_LIMIT"){
          console.log(status)
          //dataArray[i][j].push(0);
          //count++;
        }
      }); 
    }
    //console.log(count)
    
  }
  catch(error) {
    console.log("Error intento: " + count)
    console.log(error);
    count++;
    dataArray[i][j].push(0);
    j++;
    if (count == total - 1) {
      clearInterval(myInterval);
      progress2.style.animationPlayState = "running";
      lblCompletados.innerText = "Registros completados: " + (count + 1) + "/"+total;
      secondInterval = setInterval(secondTimer, 50);
    }
  }
}

/*
iniciar.addEventListener("click", () => {
  myInterval = setInterval(myTimer, 800);
  progress1.style.animationDuration = "2.55s"
  progress2.style.animationDuration = "2.55s"
  if(counter < 2) {
    progress1.style.animationPlayState = "running";
  }
  else {
    progress2.style.animationPlayState = "running";
  }
  
})

detener.addEventListener("click", () => {
  clearInterval(myInterval);
  progress1.style.animationPlayState = "paused";
  progress2.style.animationPlayState = "paused";
})
*/

function myTimer() {
  
  //lblCompletados.innerText = "Registros completados: " + count + "/"+total;
  //porc = (count * 100) / total;
  lblCompletados.innerText = "Registros completados: " + finished + "/"+total;
  porc = (finished * 100) / total;
  if (terminado < porc) {
    progress1.style.animationDuration = "2.5s"
    progress2.style.animationDuration = "2.5s"
    terminado++;
    numb.textContent = terminado + "%"
    if (terminado > 51){
      progress1.style.animationPlayState = "paused";
      progress2.style.animationPlayState = "running";
    }
    else {
      progress1.style.animationPlayState = "running";
      progress2.style.animationPlayState = "paused";
    }
  }
  else {
    progress1.style.animationPlayState = "paused";
    progress2.style.animationPlayState = "paused";
  }
}

function secondTimer() {
  if (terminado < 100) {
    terminado++;
    numb.textContent = terminado + "%"
  }
  else {
    clearInterval(secondInterval);
  }
}

// Using LocalStorage
async function getCoord3() {
  try {
    if (finished >= parseFloat(sessionStorage.getItem('total'))) {
      clearInterval(thirdInterval);
      wb = XLSX.utils.book_new();
      wb.SheetNames.push("Hoja1")
      var finalArray = [];
      console.log(excelData.length)
      console.log(newExcelData.length)
      for (var z = 0; z < excelData.length - 1; z++) {
        finalArray.push([])
        finalArray[z].push(excelData[z])
        finalArray[z].push(newExcelData[z][0])
        finalArray[z].push(newExcelData[z][1])
      }
      var ws = XLSX.utils.aoa_to_sheet(finalArray);
      wb.Sheets["Hoja1"] = ws;
      var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
      saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'coordenadas.xlsx');
      sessionStorage.clear();
      
    }
    else {
      await geocoder.geocode( { 'address': excelData[finished]}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
          var latitude = results[0].geometry.location.lat();
          var longitude = results[0].geometry.location.lng();
          newExcelData.push([])
          newExcelData[finished].push(latitude)
          newExcelData[finished].push(longitude)
          finished++;
        } 
      }); 
    }
  }
  catch(error) {
    console.log("Error intento: " + count)
    console.log(error)
    if (error.message.includes("OVER_QUERY_LIMIT")) {
      clearInterval(thirdInterval);
      var saveArray = "";
      for (var a = 0; a < newExcelData.length; a++){
        saveArray += newExcelData[a][0] + ";" + newExcelData[a][1] + ","
      }
      console.log("finished:" + finished)
      console.log("newExcelData.length:" + newExcelData.length)
      await new Promise(r => setTimeout(r, 10000));
      //sessionStorage.setItem('finished', (finished - 1));
      sessionStorage.setItem('finished', finished);
      sessionStorage.setItem('newExcelData', saveArray)
      location.reload(); 
    }
    else {
      newExcelData.push([])
      newExcelData[finished].push("0");
      newExcelData[finished].push("0");
      finished++;
    }
  }
}

function getCoord4() {
  return new Promise(resolve => {
    setTimeout(async () => {
      try {
        await geocoder.geocode( { 'address': excelData[finished]}, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
            var latitude = results[0].geometry.location.lat();
            var longitude = results[0].geometry.location.lng();
            newExcelData.push([])
            newExcelData[finished].push(latitude)
            newExcelData[finished].push(longitude)
            finished++;
            resolve(true);
          } 
        }); 
      }
      catch(error) {
        console.log(error)
        if (error.message.includes("OVER_QUERY_LIMIT")) {
          var saveArray = "";
          for (var a = 0; a < newExcelData.length; a++){
            saveArray += newExcelData[a][0] + ";" + newExcelData[a][1] + ","
          }
          await new Promise(r => setTimeout(r, 10000));
          sessionStorage.setItem('finished', finished);
          sessionStorage.setItem('newExcelData', saveArray)
          resolve(false);
        }
        else {
          newExcelData.push([])
          newExcelData[finished].push("0");
          newExcelData[finished].push("0");
          finished++;
          resolve(true);
        }
      }
    }, 500)
  })
}