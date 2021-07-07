const input = document.getElementById("input");
//const iniciar = document.getElementById("iniciar");
//const detener = document.getElementById("detener");
const progress1 = document.getElementById("progress1");
const progress2 = document.getElementById("progress2");
const lblFileName = document.getElementById("lblFileName");
const lblRegistros = document.getElementById("lblRegistros");
const lblCompletados= document.getElementById("lblCompletados");
const btnAgregarDatos = document.getElementById("btnAgregarDatos");
//const Porcentaje = document.getElementById("Porcentaje");
const numb = document.querySelector(".number");
let counter = 0;
var myInterval = null;
var secondInterval = null;
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
  await readXlsxFile(input.files[0], { getSheets: true }).then(async function(sheets) {
    for (var i = 0; i < sheets.length; i++) {
      dataArray.push([]);
      //var position = i - 1;
      await readXlsxFile(input.files[0], { sheet: i + 1 }).then(async function(sheetData) {
        for (var a = 0; a < sheetData.length; a++) {
          dataArray[i].push([sheetData[a][0]])
          total++;
        }
      })
    }
  })
  lblRegistros.innerText = "Registros detectados: " + total;
  lblRegistros.style.display = "block";
})

btnAgregarDatos.addEventListener("click", () => {
  lblCompletados.style.display = "block";
  agregar();
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
  progress1.style.animation = "left 4s linear both";
  progress2.style.animation = "left 4s linear both";
  progress1.style.animationPlayState = "paused";
  progress2.style.animationPlayState = "paused";
  progress1.style.animationDuration = ((total)/100) + "s"
  progress2.style.animationDuration = ((total)/100) + "s"

  var geocoder = new google.maps.Geocoder();
  myInterval = setInterval(myTimer, 50);
  var wb = XLSX.utils.book_new();
  for (var i = 0; i < dataArray.length; i++) {
    wb.SheetNames.push("Hoja" + (i + 1));
    for(var j = 0; j < dataArray[i].length; j++) {
      try {
        await geocoder.geocode( { 'address': dataArray[i][j][0]}, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK && results.length > 0) {
            var latitude = results[0].geometry.location.lat();
            var longitude = results[0].geometry.location.lng();
            dataArray[i][j].push(latitude);
            dataArray[i][j].push(longitude);
            count++;
          } 
          else {
            dataArray[i][j].push(0);
          }
        }); 
        if (count == total - 1) {
          clearInterval(myInterval);
          progress2.style.animationPlayState = "running";
          lblCompletados.innerText = "Registros completados: " + (count + 1) + "/"+total;
          secondInterval = setInterval(secondTimer, 50);
        }
      }
      catch(error) {
        console.log(error);
        dataArray[i][j].push(0);
        if (count == total - 1) {
          clearInterval(myInterval);
          progress2.style.animationPlayState = "running";
          lblCompletados.innerText = "Registros completados: " + (count + 1) + "/"+total;
          secondInterval = setInterval(secondTimer, 50);
        }
      }
      await new Promise(r => setTimeout(r, 250));
    }
    var ws = XLSX.utils.aoa_to_sheet(dataArray[i]);
    wb.Sheets["Hoja" + (i + 1)] = ws;
  }

  var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
  saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'coordenadas.xlsx');
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
  
  /*
  if (counter < 5) {
    if(counter >= 2) {
      progress1.style.animationPlayState = "paused";
      progress2.style.animationPlayState = "running";
    }
    counter++;
    numb.textContent = counter + "%"
  }
  else {
    clearInterval(myInterval);
  }
  */
  lblCompletados.innerText = "Registros completados: " + count + "/"+total;
  porc = (count * 100) / total;
  var speed = (total * 51) / 5
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