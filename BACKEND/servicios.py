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
# NUEVOS SERVICIOS PARA ÓRDENES DE TRABAJO
OrdenTrabajoService = BaseService("orden_trabajo")
OrdenMaterialesService = BaseService("orden_materiales")
OrdenManoObraService = BaseService("orden_mano_obra")
OrdenCIFService = BaseService("orden_cif")