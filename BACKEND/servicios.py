from database import BaseService

# Definimos los servicios para tus tablas
MaterialesService = BaseService("tablamateriales")
PersonalService = BaseService("tablapersonal")
ProductoService = BaseService("tablaproducto")
CIFService = BaseService("tablacif")
GAService = BaseService("tablaga")
GVService = BaseService("tablagv")
MODService = BaseService("tablamod")
RecetaProductoService = BaseService("recetaproducto")
RecetaManoObraService = BaseService("recetamanoobra")
OrdenTrabajoService = BaseService("orden_trabajo")
OrdenMaterialesService = BaseService("orden_materiales")
OrdenManoObraService = BaseService("orden_mano_obra")
OrdenCIFService = BaseService("orden_cif")
KardexService = BaseService("tablakardex")
CIFMensualService = BaseService("cif_mensual") 