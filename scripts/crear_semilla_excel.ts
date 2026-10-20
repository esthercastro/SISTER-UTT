import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// 51 nodos reales/representativos de la Red de Nodos de la UTT con inconsistencias típicas de planilla
const NODOS_RAW = [
  // CABA (20 nodos)
  { Nombre: "Almacén UTT Almagro", Dirección: "Díaz Vélez 3761", Localidad: "ALMAGRO", Provincia: "CABA", Teléfono: "11 3456-7890", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Caballito Parque Rivadavia", Dirección: "Rosario 650", Localidad: "Caballito", Provincia: "Caba", Teléfono: "011 15-4422-9988", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Palermo Soho", Dirección: "Armenia 1820", Localidad: "palermo", Provincia: "CABA", Teléfono: "1165894411", "Días de entrega": "Jueves" },
  { Nombre: "Almacén UTT Villa Crespo", Dirección: "Serrano 450", Localidad: "Villa Crespo", Provincia: "caba", Teléfono: "+54 9 11 5544-3322", "Días de entrega": "Ambos dias" },
  { Nombre: "Nodo Flores Plaza Misericordia", Dirección: "Directorio 2150", Localidad: "FLORES", Provincia: "CABA", Teléfono: "11-3829-1029", "Días de entrega": "Sabados" },
  { Nombre: "Nodo Chacarita Cultural", Dirección: "Olleros 3900", Localidad: "Chacarita", Provincia: "Caba", Teléfono: "11 5092 8812", "Días de entrega": "Jueves" },
  { Nombre: "Nodo Belgrano R", Dirección: "Zapiola 1650", Localidad: "Belgrano", Provincia: "CABA", Teléfono: "11 4782-9011", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Saavedra Parque", Dirección: "Pinto 3400", Localidad: "Saavedra", Provincia: "CABA", Teléfono: "11 6721-3344", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Colegiales Conesa", Dirección: "Conesa 850", Localidad: "Colegiales", Provincia: "Caba", Teléfono: "11 4552-1199", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Boedo Vecinal", Dirección: "San Juan 3450", Localidad: "boedo", Provincia: "CABA", Teléfono: "11 2341-9876", "Días de entrega": "Ambos dias" },
  { Nombre: "Almacén UTT San Telmo", Dirección: "Defensa 1120", Localidad: "San Telmo", Provincia: "CABA", Teléfono: "11 6112-4455", "Días de entrega": "Jueves" },
  { Nombre: "Nodo Parque Patricios Huella", Dirección: "Caseros 2850", Localidad: "Parque Patricios", Provincia: "Caba", Teléfono: "11 4308-2211", "Días de entrega": "Sabados" },
  { Nombre: "Nodo Villa Urquiza La Estación", Dirección: "Monroe 4900", Localidad: "Villa Urquiza", Provincia: "CABA", Teléfono: "11 4521-8877", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Villa Devoto Plaza", Dirección: "Nueva York 3800", Localidad: "VILLA DEVOTO", Provincia: "CABA", Teléfono: "11 3910-2938", "Días de entrega": "Jueves" },
  { Nombre: "Nodo Villa Pueyrredón", Dirección: "Artigas 4900", Localidad: "Villa Pueyrredon", Provincia: "Caba", Teléfono: "11 6299-1020", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Nuñez O'Higgins", Dirección: "O'Higgins 3100", Localidad: "Nuñez", Provincia: "CABA", Teléfono: "11 4701-5522", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Constitución Barrial", Dirección: "Brasil 1250", Localidad: "Constitucion", Provincia: "caba", Teléfono: "11 3321-4477", "Días de entrega": "Jueves" },
  { Nombre: "Nodo Floresta Gaona", Dirección: "Gaona 4100", Localidad: "Floresta", Provincia: "CABA", Teléfono: "11 4672-8811", "Días de entrega": "Sabados" },
  { Nombre: "Nodo Mataderos Alimentos Sanos", Dirección: "Alberdi 5800", Localidad: "Mataderos", Provincia: "Caba", Teléfono: "11 4687-3344", "Días de entrega": "Ambos dias" },
  { Nombre: "Nodo Liniers Frontera", Dirección: "Rivadavia 11200", Localidad: "Liniers", Provincia: "CABA", Teléfono: "11 5566-7788", "Días de entrega": "Sábados" },

  // ZONA NORTE (10 nodos)
  { Nombre: "Almacén UTT Vicente López", Dirección: "Maipú 1540", Localidad: "Vicente Lopez", Provincia: "NORTE", Teléfono: "11 4791-2233", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Olivos Puerto", Dirección: "Corrientes 450", Localidad: "Olivos", Provincia: "Norte", Teléfono: "11 4795-8822", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Florida Mitre", Dirección: "San Martín 2100", Localidad: "Florida", Provincia: "norte", Teléfono: "11 6720-1122", "Días de entrega": "Jueves" },
  { Nombre: "Almacén UTT San Isidro", Dirección: "Belgrano 320", Localidad: "San Isidro", Provincia: "NORTE", Teléfono: "11 4743-9900", "Días de entrega": "Ambos dias" },
  { Nombre: "Nodo Martínez Santa Fe", Dirección: "Santa Fe 1950", Localidad: "Martinez", Provincia: "Norte", Teléfono: "11 4792-5544", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Acassuso Estación", Dirección: "Perú 420", Localidad: "Acassuso", Provincia: "Norte", Teléfono: "11 4742-1200", "Días de entrega": "Sabados" },
  { Nombre: "Nodo Beccar Comunitario", Dirección: "Centenario 1800", Localidad: "Beccar", Provincia: "NORTE", Teléfono: "11 4747-8899", "Días de entrega": "Jueves" },
  { Nombre: "Nodo San Fernando Casco", Dirección: "Constitución 920", Localidad: "San Fernando", Provincia: "Norte", Teléfono: "11 4744-3311", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Tigre Estación Fluvial", Dirección: "Cazón 1200", Localidad: "Tigre", Provincia: "norte", Teléfono: "11 4731-6655", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Villa Ballester Central", Dirección: "Alvear 2450", Localidad: "Villa Ballester", Provincia: "Norte", Teléfono: "11 4768-4422", "Días de entrega": "Sábados" },

  // ZONA SUR (12 nodos)
  { Nombre: "Almacén UTT Avellaneda", Dirección: "Mitre 850", Localidad: "Avellaneda", Provincia: "SUR", Teléfono: "11 4201-9988", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Lanús Oeste Hipólito", Dirección: "Hipólito Yrigoyen 4100", Localidad: "Lanus Oeste", Provincia: "Sur", Teléfono: "11 4241-5566", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Lanús Este 9 de Julio", Dirección: "9 de Julio 1450", Localidad: "Lanus", Provincia: "sur", Teléfono: "11 4249-1122", "Días de entrega": "Jueves" },
  { Nombre: "Nodo Banfield Centro", Dirección: "Maipú 280", Localidad: "Banfield", Provincia: "SUR", Teléfono: "11 4242-7788", "Días de entrega": "Sabados" },
  { Nombre: "Nodo Lomas de Zamora Laprida", Dirección: "Laprida 620", Localidad: "Lomas de Zamora", Provincia: "Sur", Teléfono: "11 4244-3399", "Días de entrega": "Ambos dias" },
  { Nombre: "Nodo Temperley Sur", Dirección: "25 de Mayo 150", Localidad: "Temperley", Provincia: "Sur", Teléfono: "11 4231-8844", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Adrogué Plaza Brown", Dirección: "Diagonal Brown 1350", Localidad: "Adrogue", Provincia: "SUR", Teléfono: "11 4294-2200", "Días de entrega": "Jueves" },
  { Nombre: "Almacén UTT Quilmes Centro", Dirección: "Rivadavia 340", Localidad: "Quilmes", Provincia: "Sur", Teléfono: "11 4253-1122", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Bernal Belgrano", Dirección: "Belgrano 450", Localidad: "Bernal", Provincia: "sur", Teléfono: "11 4251-6677", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Berazategui 14", Dirección: "Calle 14 nro 4800", Localidad: "Berazategui", Provincia: "SUR", Teléfono: "11 4226-9933", "Días de entrega": "Sábados" },
  { Nombre: "Almacén UTT La Plata 1", Dirección: "Calle 1 nro 1250", Localidad: "La Plata", Provincia: "Sur", Teléfono: "0221 15-456-7890", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo City Bell Cantilo", Dirección: "Cantilo 480", Localidad: "City Bell", Provincia: "SUR", Teléfono: "0221 15-567-8901", "Días de entrega": "Sabados" },

  // ZONA OESTE (9 nodos)
  { Nombre: "Almacén UTT Morón Centro", Dirección: "Brown 750", Localidad: "Moron", Provincia: "OESTE", Teléfono: "11 4627-8899", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Castelar Sur", Dirección: "Arias 2340", Localidad: "Castelar", Provincia: "Oeste", Teléfono: "11 4658-3322", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Haedo Rivadavia", Dirección: "Rivadavia 16200", Localidad: "Haedo", Provincia: "oeste", Teléfono: "11 4659-1144", "Días de entrega": "Jueves" },
  { Nombre: "Nodo Ramos Mejía Avenida", Dirección: "Avenida de Mayo 850", Localidad: "Ramos Mejia", Provincia: "OESTE", Teléfono: "11 4656-7788", "Días de entrega": "Ambos dias" },
  { Nombre: "Nodo Ituzaingó Soler", Dirección: "Soler 220", Localidad: "Ituzaingo", Provincia: "Oeste", Teléfono: "11 4624-9911", "Días de entrega": "Sabados" },
  { Nombre: "Nodo San Justo Arieta", Dirección: "Dr. Ignacio Arieta 3200", Localidad: "San Justo", Provincia: "OESTE", Teléfono: "11 4484-2255", "Días de entrega": "Sábados" },
  { Nombre: "Nodo Hurlingham Vergara", Dirección: "Vergara 3900", Localidad: "Hurlingham", Provincia: "Oeste", Teléfono: "11 4665-1100", "Días de entrega": "Jueves" },
  { Nombre: "Nodo Caseros 3 de Febrero", Dirección: "Urquiza 4800", Localidad: "Caseros", Provincia: "oeste", Teléfono: "11 4750-3344", "Días de entrega": "Ambos días" },
  { Nombre: "Nodo Moreno Plaza", Dirección: "Joly 2650", Localidad: "Moreno", Provincia: "OESTE", Teléfono: "11 5122-8877", "Días de entrega": "Sabados" },
];

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const worksheet = XLSX.utils.json_to_sheet(NODOS_RAW);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Nodos UTT');

const filePath = path.join(dataDir, 'NODOS_UTT.xlsx');
XLSX.writeFile(workbook, filePath);
console.log(`Planilla semilla creada con éxito en: ${filePath} (${NODOS_RAW.length} nodos)`);
