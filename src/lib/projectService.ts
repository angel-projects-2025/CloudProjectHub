import { supabase } from './supabase'

export interface Proyecto {
  id: string
  usuario_id: string
  nombre: string
  descripcion: string | null
  categoria: string
  etiquetas: string[]
  destacado: boolean
  archivo_nombre: string
  archivo_path: string
  archivo_tamano: number
  archivo_tipo: string
  estado: string
  url_proyecto: string | null
  vercel_project_id: string | null
  created_at: string
  update_at: string | null
}

export interface ProyectoVercel {
  id: string
  name: string
  framework: string | null
}

export async function obtenerProyectos(): Promise<Proyecto[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(
      `Error al obtener usuario: ${userError.message}`
    )
  }

  if (!user) {
    throw new Error(
      'Debes iniciar sesión para ver tus proyectos.'
    )
  }

  const { data, error } = await supabase
    .from('proyectos')
    .select('*')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(
      `Error al cargar proyectos: ${error.message}`
    )
  }

  return (data || []) as Proyecto[]
}

export async function obtenerProyectosVercel(): Promise<
  ProyectoVercel[]
> {
  const { data, error } =
    await supabase.functions.invoke(
      'vercel-projects'
    )

  if (error) {
    throw new Error(
      `Error al consultar Vercel: ${error.message}`
    )
  }

  if (data?.error) {
    throw new Error(
      `Error de Vercel: ${data.error}`
    )
  }

  return data?.projects || []
}

export async function subirProyecto(
  nombre: string,
  descripcion: string,
  categoria: string,
  etiquetas: string[],
  archivo: File,
  vercelProjectId: string
): Promise<Proyecto> {
  const esZip =
    archivo.type === 'application/zip' ||
    archivo.type === 'application/x-zip-compressed' ||
    archivo.name.toLowerCase().endsWith('.zip')

  if (!esZip) {
    throw new Error('Solo se permiten archivos ZIP.')
  }

  const maximo = 50 * 1024 * 1024

  if (archivo.size > maximo) {
    throw new Error(
      'El archivo no puede superar los 50 MB.'
    )
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(
      `Error al obtener usuario: ${userError.message}`
    )
  }

  if (!user) {
    throw new Error(
      'Debes iniciar sesión para subir un proyecto.'
    )
  }

  const nombreArchivo = `${crypto.randomUUID()}.zip`
  const archivoPath = `${user.id}/${nombreArchivo}`

  const { error: uploadError } =
    await supabase.storage
      .from('proyectos')
      .upload(
        archivoPath,
        archivo,
        {
          contentType: 'application/zip',
          upsert: false,
        }
      )

  if (uploadError) {
    throw new Error(
      `Error al subir el archivo: ${uploadError.message}`
    )
  }

  const {
    data,
    error: databaseError,
  } = await supabase
    .from('proyectos')
    .insert({
      usuario_id: user.id,
      nombre: nombre.trim(),
      descripcion:
        descripcion.trim() || null,
      categoria:
        categoria.trim() || 'Otros',
      etiquetas,
      destacado: false,
      archivo_nombre: archivo.name,
      archivo_path: archivoPath,
      archivo_tamano: archivo.size,
      archivo_tipo:
        archivo.type || 'application/zip',
      estado: 'activo',
      vercel_project_id: vercelProjectId,
    })
    .select('*')
    .single()

  if (databaseError) {
    await supabase.storage
      .from('proyectos')
      .remove([archivoPath])

    throw new Error(
      `Error al guardar el proyecto: ${databaseError.message}`
    )
  }

  return data as Proyecto
}

export async function obtenerUrlDescarga(
  archivoPath: string
): Promise<string> {
  const { data, error } =
    await supabase.storage
      .from('proyectos')
      .createSignedUrl(
        archivoPath,
        60 * 10
      )

  if (error) {
    throw new Error(
      `Error al generar descarga: ${error.message}`
    )
  }

  return data.signedUrl
}

export async function eliminarProyecto(
  id: string,
  archivoPath: string
): Promise<void> {
  const { error: storageError } =
    await supabase.storage
      .from('proyectos')
      .remove([archivoPath])

  if (storageError) {
    throw new Error(
      `Error al eliminar archivo: ${storageError.message}`
    )
  }

  const { error: databaseError } =
    await supabase
      .from('proyectos')
      .update({
        estado: 'eliminado',
      })
      .eq('id', id)

  if (databaseError) {
    throw new Error(
      `Error al eliminar proyecto: ${databaseError.message}`
    )
  }
}

export async function actualizarProyecto(
  id: string,
  datos: {
    nombre: string
    descripcion: string
    categoria: string
    etiquetas: string[]
  }
): Promise<Proyecto> {
  const { data, error } =
    await supabase
      .from('proyectos')
      .update({
        nombre: datos.nombre.trim(),
        descripcion:
          datos.descripcion.trim() || null,
        categoria:
          datos.categoria.trim() || 'Otros',
        etiquetas: datos.etiquetas,
      })
      .eq('id', id)
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Error al actualizar proyecto: ${error.message}`
    )
  }

  return data as Proyecto
}

export async function cambiarProyectoDestacado(
  id: string,
  destacado: boolean
): Promise<Proyecto> {
  const { data, error } =
    await supabase
      .from('proyectos')
      .update({
        destacado,
      })
      .eq('id', id)
      .select('*')
      .single()

  if (error) {
    throw new Error(
      `Error al cambiar proyecto destacado: ${error.message}`
    )
  }

  return data as Proyecto
}