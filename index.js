const input = document.getElementById("input");
const btnAgregarDatos = document.getElementById("btnAgregarDatos");
const Porcentaje = document.getElementById("Porcentaje");
const formaingresar = document.getElementById("formaingresar");
var auth = firebase.auth();
var dataArray;
var total = 0;

auth.onAuthStateChanged(user => {
  if(user) {
    console.log("Usuario loggeado")
  }
  else {
    console.log("Usuario no loggeado")
  }
});

formaingresar.addEventListener("submit", (e) => {
  e.preventDefault();

  let correo = formaingresar['correo'].value;
  let contrasenia = formaingresar['contraseña'].value;

  auth.signInWithEmailAndPassword(correo, contrasenia).then(credencial => {
    $('#ingresarModal').modal('hide');
    formaingresar.reset();
    formaingresar.querySelector('.error').innerHTML = ''
  }).catch(error => {
    console.log(error);
    formaingresar.querySelector('.error').innerHTML = mensajeError(error.code)
  });
})

input.addEventListener("change", function() {
  dataArray = [];
  total = 0;
  readXlsxFile(input.files[0], { getSheets: true }).then(async function(sheets) {
    for (var i = 0; i < sheets.length; i++) {
      dataArray.push([]);
      //var position = i - 1;
      await readXlsxFile(input.files[0], { sheet: i + 1 }).then(async function(sheetData) {
        for (var a = 0; a < sheetData.length; a++) {
          console.log(sheetData[a][0])
          dataArray[i].push([sheetData[a][0]])
          total++;
        }
      })
    }
  })
  console.log(dataArray[0])
})


btnLocation.addEventListener("click", () => {
  
  console.log(dataArray[0])
  //geocoder.geocode( { 'address': txtAddress.value}, function(results, status) {
    //console.log(results[0].geometry.location)
    //if (status == google.maps.GeocoderStatus.OK) {
      //var latitude = results[0].geometry.location.lat();
      //var longitude = results[0].geometry.location.lng();
      //lblLat.innerHTML = "Latitud: " + latitude;
      //lblLng.innerHTML = "Longitud: " + longitude;
    //} 
  //}); 
})



btnAgregarDatos.addEventListener("click", () => {
  //console.log(dataArray)
  agregar();
})

function s2ab(s) { 
  var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
  var view = new Uint8Array(buf);  //create uint8array as viewer
  for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
  return buf;    
}

async function agregar() {
  var porc = 0; 
  var count = 0;
  var geocoder = new google.maps.Geocoder();

  var wb = XLSX.utils.book_new();
  for (var i = 0; i < dataArray.length; i++) {
    wb.SheetNames.push("Hoja" + (i + 1));
    for(var j = 0; j < dataArray[i].length; j++) {
      //console.log(dataArray[i][j][0])
      await geocoder.geocode( { 'address': dataArray[i][j][0]}, function(results, status) {
        //console.log(results[0].geometry.location)
        if (status == google.maps.GeocoderStatus.OK) {
          var latitude = results[0].geometry.location.lat();
          var longitude = results[0].geometry.location.lng();
          dataArray[i][j].push(latitude + ", " + longitude);
          count++;
          porc = (count * 100) / total;
          Porcentaje.innerHTML = porc + "%";
        } 
        else {
          dataArray[i][j].push("Error")
        }
      }); 
    }
    var ws = XLSX.utils.aoa_to_sheet(dataArray[i]);
    wb.Sheets["Hoja" + (i + 1)] = ws;
  }

  var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
  saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'test.xlsx');
}

