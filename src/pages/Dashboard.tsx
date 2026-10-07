import { useEffect, useMemo, useState } from 'react'
import {
  Upload,
  Download,
  Trash2,
  Rocket,
  FileArchive,
  Calendar,
  HardDrive,
  Search,
  Plus,
  X,
  Cloud,
  Star,
  FolderKanban,
  LogOut,
  Globe,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import {
  obtenerProyectos,
  obtenerProyectosVercel,
  subirProyecto,
  obtenerUrlDescarga,
  eliminarProyecto,
  cambiarProyectoDestacado,
  type Proyecto,
  type ProyectoVercel,
} from '../lib/projectService'

import './Dashboard.css'

interface ProyectoURL {
  id: number
  nombre: string
  descripcion: string
  url: string
  categoria: string
  etiquetas: string[]
  created_at: string
  tipo: 'url'
}

export default function Dashboard() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [proyectosVercel, setProyectosVercel] = useState<
    ProyectoVercel[]
  >([])

  const [proyectosURL, setProyectosURL] = useState<ProyectoURL[]>([])

  const [vercelProjectId, setVercelProjectId] = useState('')
  const [urlProyecto, setUrlProyecto] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)

  const [cargando, setCargando] = useState(true)
  const [cargandoVercel, setCargandoVercel] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)

  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState<
    'success' | 'danger'
  >('success')

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('Web')
  const [etiquetas, setEtiquetas] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  useEffect(() => {
    cargarProyectos()
    cargarProyectosVercel()
    cargarProyectosURL()
  }, [])

  // ==============================
  // PROYECTOS NORMALES
  // ==============================

  async function cargarProyectos() {
    try {
      setCargando(true)

      const datos = await obtenerProyectos()

      setProyectos(datos)
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los proyectos.',
        'danger'
      )
    } finally {
      setCargando(false)
    }
  }

  async function cargarProyectosVercel() {
    try {
      setCargandoVercel(true)

      const datos = await obtenerProyectosVercel()

      setProyectosVercel(datos)
    } catch (error) {
      console.error(
        'No se pudieron cargar los proyectos de Vercel:',
        error
      )
    } finally {
      setCargandoVercel(false)
    }
  }

  // ==============================
  // PROYECTOS POR URL
  // ==============================

  function cargarProyectosURL() {
    try {
      const guardados = localStorage.getItem(
        'cloudprojecthub_url_projects'
      )

      if (!guardados) {
        setProyectosURL([])
        return
      }

      const proyectosGuardados: ProyectoURL[] =
        JSON.parse(guardados)

      setProyectosURL(proyectosGuardados)
    } catch (error) {
      console.error(
        'No se pudieron cargar los proyectos por URL:',
        error
      )

      setProyectosURL([])
    }
  }

  function guardarProyectosURL(
    proyectosActualizados: ProyectoURL[]
  ) {
    localStorage.setItem(
      'cloudprojecthub_url_projects',
      JSON.stringify(proyectosActualizados)
    )

    setProyectosURL(proyectosActualizados)
  }

  function guardarProyectoURL() {
    if (!urlProyecto.trim()) {
      return
    }

    let urlValida: URL

    try {
      urlValida = new URL(urlProyecto.trim())
    } catch {
      mostrarMensaje(
        'Ingresa una URL válida. Ejemplo: https://mi-proyecto.vercel.app',
        'danger'
      )

      return
    }

    if (
      urlValida.protocol !== 'http:' &&
      urlValida.protocol !== 'https:'
    ) {
      mostrarMensaje(
        'La URL debe comenzar con http:// o https://',
        'danger'
      )

      return
    }

    const nuevoProyecto: ProyectoURL = {
      id: Date.now(),
      nombre:
        nombre.trim() ||
        urlValida.hostname.replace('www.', ''),
      descripcion:
        descripcion.trim() ||
        'Proyecto agregado mediante URL.',
      url: urlValida.toString(),
      categoria,
      etiquetas: etiquetas
        .split(',')
        .map((etiqueta) => etiqueta.trim())
        .filter(Boolean),
      created_at: new Date().toISOString(),
      tipo: 'url',
    }

    const proyectosActualizados = [
      nuevoProyecto,
      ...proyectosURL,
    ]

    guardarProyectosURL(proyectosActualizados)

    setUrlProyecto('')

    mostrarMensaje(
      'URL del proyecto guardada correctamente.',
      'success'
    )
  }

  function eliminarProyectoUrl(id: number) {
    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar este proyecto?'
    )

    if (!confirmar) return

    const proyectosActualizados =
      proyectosURL.filter(
        (proyecto) => proyecto.id !== id
      )

    guardarProyectosURL(proyectosActualizados)

    mostrarMensaje(
      'Proyecto eliminado correctamente.',
      'success'
    )
  }

  function abrirProyectoUrl(url: string) {
    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    )
  }

  // ==============================
  // MENSAJES
  // ==============================

  function mostrarMensaje(
    texto: string,
    tipo: 'success' | 'danger'
  ) {
    setMensaje(texto)
    setTipoMensaje(tipo)

    setTimeout(() => {
      setMensaje('')
    }, 4000)
  }

  // ==============================
  // FORMULARIO
  // ==============================

  function limpiarFormulario() {
    setNombre('')
    setDescripcion('')
    setCategoria('Web')
    setEtiquetas('')
    setArchivo(null)
    setVercelProjectId('')
    setUrlProyecto('')
    setProgreso(0)
  }

  function cerrarModal() {
    if (subiendo) return

    setMostrarModal(false)
    limpiarFormulario()
  }

  async function manejarSubida(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!nombre.trim()) {
      mostrarMensaje(
        'Ingresa un nombre para el proyecto.',
        'danger'
      )

      return
    }

    /*
     * Si el usuario colocó una URL,
     * primero guardamos el proyecto por URL.
     */
    if (urlProyecto.trim()) {
      guardarProyectoURL()
      return
    }

    if (!archivo) {
      mostrarMensaje(
        'Selecciona un archivo ZIP.',
        'danger'
      )

      return
    }

    if (!vercelProjectId) {
      mostrarMensaje(
        'Selecciona el proyecto desplegado en Vercel o coloca una URL.',
        'danger'
      )

      return
    }

    let intervalo: number | undefined

    try {
      setSubiendo(true)
      setProgreso(10)

      intervalo = window.setInterval(() => {
        setProgreso((actual) => {
          if (actual >= 90) {
            return actual
          }

          return actual + 5
        })
      }, 300)

      const listaEtiquetas = etiquetas
        .split(',')
        .map((etiqueta) => etiqueta.trim())
        .filter(Boolean)

      const nuevoProyecto = await subirProyecto(
        nombre,
        descripcion,
        categoria,
        listaEtiquetas,
        archivo,
        vercelProjectId
      )

      if (intervalo) {
        window.clearInterval(intervalo)
      }

      setProgreso(100)

      setProyectos((actuales) => [
        nuevoProyecto,
        ...actuales,
      ])

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      )

      setMostrarModal(false)

      limpiarFormulario()

      mostrarMensaje(
        'Proyecto guardado correctamente en la nube.',
        'success'
      )
    } catch (error) {
      if (intervalo) {
        window.clearInterval(intervalo)
      }

      setProgreso(0)

      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo subir el proyecto.',
        'danger'
      )
    } finally {
      if (intervalo) {
        window.clearInterval(intervalo)
      }

      setSubiendo(false)
    }
  }

  // ==============================
  // ABRIR PROYECTO VERCEL
  // ==============================

  async function manejarAbrir(
    proyecto: Proyecto
  ) {
    if (!proyecto.vercel_project_id) {
      mostrarMensaje(
        'Este proyecto no tiene un proyecto de Vercel vinculado.',
        'danger'
      )

      return
    }

    try {
      let proyectosActuales = proyectosVercel

      let encontrado = proyectosActuales.find(
        (item) =>
          item.id === proyecto.vercel_project_id
      )

      if (!encontrado) {
        setCargandoVercel(true)

        proyectosActuales =
          await obtenerProyectosVercel()

        setProyectosVercel(proyectosActuales)

        setCargandoVercel(false)

        encontrado = proyectosActuales.find(
          (item) =>
            item.id ===
            proyecto.vercel_project_id
        )
      }

      if (!encontrado) {
        mostrarMensaje(
          'No se encontró el proyecto vinculado en Vercel.',
          'danger'
        )

        return
      }

      const url = `https://${encontrado.name}.vercel.app`

      window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      )
    } catch (error) {
      setCargandoVercel(false)

      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo abrir el proyecto.',
        'danger'
      )
    }
  }

  async function manejarDescarga(
    proyecto: Proyecto
  ) {
    try {
      const url = await obtenerUrlDescarga(
        proyecto.archivo_path
      )

      window.open(url, '_blank')
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo generar la descarga.',
        'danger'
      )
    }
  }

  async function manejarEliminar(
    proyecto: Proyecto
  ) {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar "${proyecto.nombre}"?`
    )

    if (!confirmar) return

    try {
      await eliminarProyecto(
        proyecto.id,
        proyecto.archivo_path
      )

      setProyectos((actuales) =>
        actuales.filter(
          (item) => item.id !== proyecto.id
        )
      )

      mostrarMensaje(
        'Proyecto eliminado correctamente.',
        'success'
      )
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el proyecto.',
        'danger'
      )
    }
  }

  async function manejarDestacado(
    proyecto: Proyecto
  ) {
    try {
      const actualizado =
        await cambiarProyectoDestacado(
          proyecto.id,
          !proyecto.destacado
        )

      setProyectos((actuales) =>
        actuales.map((item) =>
          item.id === proyecto.id
            ? actualizado
            : item
        )
      )

      mostrarMensaje(
        actualizado.destacado
          ? 'Proyecto marcado como destacado.'
          : 'Proyecto quitado de destacados.',
        'success'
      )
    } catch (error) {
      mostrarMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el proyecto.',
        'danger'
      )
    }
  }

  // ==============================
  // UTILIDADES
  // ==============================

  function formatearTamano(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return `${(
      bytes /
      (1024 * 1024 * 1024)
    ).toFixed(2)} GB`
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString(
      'es-PE',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  const proyectosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim()

    if (!texto) {
      return proyectos
    }

    return proyectos.filter((proyecto) => {
      const contenido = [
        proyecto.nombre,
        proyecto.descripcion || '',
        proyecto.categoria,
        proyecto.archivo_nombre,
        ...proyecto.etiquetas,
      ]
        .join(' ')
        .toLowerCase()

      return contenido.includes(texto)
    })
  }, [proyectos, busqueda])

  const proyectosURLFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim()

    if (!texto) {
      return proyectosURL
    }

    return proyectosURL.filter((proyecto) => {
      const contenido = [
        proyecto.nombre,
        proyecto.descripcion,
        proyecto.categoria,
        proyecto.url,
        ...proyecto.etiquetas,
      ]
        .join(' ')
        .toLowerCase()

      return contenido.includes(texto)
    })
  }, [proyectosURL, busqueda])

  const almacenamientoUsado = useMemo(() => {
    return proyectos.reduce(
      (total, proyecto) =>
        total + (proyecto.archivo_tamano || 0),
      0
    )
  }, [proyectos])

  const proyectosDestacados = proyectos.filter(
    (proyecto) => proyecto.destacado
  ).length

  const almacenamientoMaximo =
    500 * 1024 * 1024

  const porcentajeAlmacenamiento = Math.min(
    (almacenamientoUsado /
      almacenamientoMaximo) *
      100,
    100
  )

  const ultimoProyecto =
    proyectos.length > 0
      ? proyectos.reduce((ultimo, proyecto) => {
          const fechaUltimo =
            ultimo.update_at ||
            ultimo.created_at

          const fechaProyecto =
            proyecto.update_at ||
            proyecto.created_at

          return new Date(fechaProyecto) >
            new Date(fechaUltimo)
            ? proyecto
            : ultimo
        })
      : null

  function textoUltimaActualizacion() {
    if (!ultimoProyecto) {
      return 'Sin proyectos'
    }

    const fecha = new Date(
      ultimoProyecto.update_at ||
        ultimoProyecto.created_at
    )

    const hoy = new Date()

    const mismaFecha =
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear()

    if (mismaFecha) {
      return 'Hoy'
    }

    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
    })
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  return (
    <div className="cloud-dashboard">

      {/* HEADER */}

      <header className="cloud-header">
        <div className="cloud-header-inner">

          <div className="brand">

            <div className="brand-icon">
              <Cloud size={23} />
            </div>

            <div>
              <strong>
                CloudProjectHub
              </strong>

              <span>
                Gestión de proyectos cloud
              </span>
            </div>

          </div>

          <div className="header-actions">

            <button
              className="btn btn-primary"
              onClick={() =>
                setMostrarModal(true)
              }
            >
              <Plus size={18} />
              Nuevo proyecto
            </button>

            <button
              className="logout-button"
              onClick={cerrarSesion}
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>

          </div>

        </div>
      </header>

      {/* MAIN */}

      <main className="cloud-main">

        {/* HERO */}

        <section className="hero">

          <div className="hero-content">

            <div className="hero-badge">
              <Rocket size={15} />
              PORTAFOLIO CLOUD
            </div>

            <h2>
              Tus proyectos,
              <br />
              <span>
                organizados y listos.
              </span>
            </h2>

            <p>
              Guarda, organiza y administra tus
              proyectos desarrollados para la nube
              desde una plataforma centralizada.
            </p>

            <button
              className="btn btn-primary hero-button"
              onClick={() =>
                setMostrarModal(true)
              }
            >
              <Upload size={18} />
              Subir proyecto
            </button>

          </div>

          <div className="hero-decoration">

            <div className="hero-glow"></div>

            <div className="floating-card floating-card-main">

              <div className="floating-icon">
                <FileArchive size={22} />
              </div>

              <div>
                <strong>
                  {proyectos.length +
                    proyectosURL.length}{' '}
                  proyectos
                </strong>

                <span>
                  Almacenados
                </span>
              </div>

            </div>

            <div className="floating-card floating-card-small">

              <div className="floating-icon cloud-icon">
                <Cloud size={20} />
              </div>

              <div>
                <strong>
                  Supabase
                </strong>

                <span>
                  Cloud Storage
                </span>
              </div>

            </div>

          </div>

        </section>

        {/* ESTADÍSTICAS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon blue">
              <FolderKanban size={21} />
            </div>

            <div>
              <span>
                Proyectos
              </span>

              <strong>
                {proyectos.length +
                  proyectosURL.length}
              </strong>

              <small>
                {proyectosDestacados} destacados
              </small>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon green">
              <Rocket size={21} />
            </div>

            <div>
              <span>
                Activos
              </span>

              <strong>
                {proyectos.length +
                  proyectosURL.length}
              </strong>

              <small>
                Proyectos disponibles
              </small>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon purple">
              <Calendar size={21} />
            </div>

            <div>
              <span>
                Última actualización
              </span>

              <strong>
                {textoUltimaActualizacion()}
              </strong>

              <small>
                Último proyecto registrado
              </small>
            </div>

          </div>

          <div className="stat-card storage-stat-card">

            <div className="stat-icon orange">
              <HardDrive size={21} />
            </div>

            <div className="storage-content">

              <div className="storage-heading">

                <span>
                  Almacenamiento utilizado
                </span>

                <strong>
                  {porcentajeAlmacenamiento.toFixed(
                    1
                  )}
                  %
                </strong>

              </div>

              <div className="storage-bar">

                <div
                  className="storage-bar-fill"
                  style={{
                    width: `${porcentajeAlmacenamiento}%`,
                  }}
                />

              </div>

              <small>
                {formatearTamano(
                  almacenamientoUsado
                )}{' '}
                / 500 MB
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon blue">
              <Cloud size={21} />
            </div>

            <div>
              <span>
                Plataforma
              </span>

              <strong>
                Supabase
              </strong>

              <small>
                Storage conectado
              </small>
            </div>

          </div>

        </section>

        {/* MENSAJE */}

        {mensaje && (
          <div
            className={`message ${tipoMensaje}`}
          >
            {mensaje}
          </div>
        )}

        {/* PROYECTOS ZIP */}

        <section className="projects-section">

          <div className="projects-toolbar">

            <div>

              <span className="section-label">
                PORTAFOLIO
              </span>

              <h3>
                Mis proyectos
              </h3>

              <p>
                Todos tus proyectos organizados
                desde un solo lugar.
              </p>

            </div>

            <div className="search-box">

              <Search size={18} />

              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
              />

            </div>

          </div>

          {cargando ? (

            <div className="empty-card">

              <div className="empty-icon">
                <Cloud size={28} />
              </div>

              <h4>
                Cargando proyectos...
              </h4>

              <p>
                Estamos consultando tu
                almacenamiento en la nube.
              </p>

            </div>

          ) : proyectosFiltrados.length === 0 ? (

            <div className="empty-card">

              <div className="empty-icon">
                <FolderKanban size={28} />
              </div>

              <h4>
                {busqueda
                  ? 'No encontramos proyectos'
                  : 'Aún no tienes proyectos'}
              </h4>

              <p>
                {busqueda
                  ? 'Prueba con otro nombre, categoría o etiqueta.'
                  : 'Sube tu primer proyecto ZIP y empieza a organizar tu portafolio cloud.'}
              </p>

              {!busqueda && (
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    setMostrarModal(true)
                  }
                >
                  <Upload size={18} />
                  Subir mi primer proyecto
                </button>
              )}

            </div>

          ) : (

            <div className="projects-grid">

              {proyectosFiltrados.map(
                (proyecto) => (

                  <article
                    className="project-card"
                    key={proyecto.id}
                  >

                    <div className="project-cover">

                      <div className="project-cover-pattern"></div>

                      <div className="project-file-icon">
                        <FileArchive size={32} />
                      </div>

                      <div className="project-status">
                        <span></span>
                        Activo
                      </div>

                      <button
                        className={`favorite-button ${
                          proyecto.destacado
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          manejarDestacado(
                            proyecto
                          )
                        }
                        title={
                          proyecto.destacado
                            ? 'Quitar destacado'
                            : 'Marcar como destacado'
                        }
                      >
                        <Star
                          size={17}
                          fill={
                            proyecto.destacado
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>

                    </div>

                    <div className="project-content">

                      <div className="project-top">

                        <span className="project-category">
                          {proyecto.categoria}
                        </span>

                        <span className="project-size">
                          {formatearTamano(
                            proyecto.archivo_tamano
                          )}
                        </span>

                      </div>

                      <h4>
                        {proyecto.nombre}
                      </h4>

                      <p>
                        {proyecto.descripcion ||
                          'Sin descripción disponible.'}
                      </p>

                      {proyecto.etiquetas.length > 0 && (

                        <div className="project-tags">

                          {proyecto.etiquetas
                            .slice(0, 3)
                            .map(
                              (etiqueta) => (
                                <span
                                  key={etiqueta}
                                >
                                  {etiqueta}
                                </span>
                              )
                            )}

                        </div>

                      )}

                      <div className="project-meta">

                        <span>
                          <FileArchive
                            size={15}
                          />

                          {proyecto.archivo_nombre}
                        </span>

                        <span>
                          <Calendar
                            size={15}
                          />

                          {formatearFecha(
                            proyecto.created_at
                          )}
                        </span>

                      </div>

                      <div className="project-actions">

                        <button
                          className="project-open"
                          onClick={() =>
                            manejarAbrir(
                              proyecto
                            )
                          }
                        >
                          <Rocket size={16} />
                          Abrir
                        </button>

                        <button
                          className="project-download"
                          onClick={() =>
                            manejarDescarga(
                              proyecto
                            )
                          }
                          title="Descargar ZIP"
                        >
                          <Download size={17} />
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            manejarEliminar(
                              proyecto
                            )
                          }
                          title="Eliminar proyecto"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

        </section>

        {/* PROYECTOS POR URL */}

        {proyectosURLFiltrados.length > 0 && (

          <section className="projects-section">

            <div className="projects-toolbar">

              <div>

                <span className="section-label">
                  PROYECTOS EXTERNOS
                </span>

                <h3>
                  Proyectos mediante URL
                </h3>

                <p>
                  Proyectos que agregaste mediante
                  un enlace.
                </p>

              </div>

            </div>

            <div className="projects-grid">

              {proyectosURLFiltrados.map(
                (proyecto) => (

                  <article
                    className="project-card"
                    key={`url-${proyecto.id}`}
                  >

                    <div className="project-cover">

                      <div className="project-cover-pattern"></div>

                      <div className="project-file-icon">
                        <Globe size={32} />
                      </div>

                      <div className="project-status">
                        <span></span>
                        URL
                      </div>

                    </div>

                    <div className="project-content">

                      <div className="project-top">

                        <span className="project-category">
                          {proyecto.categoria}
                        </span>

                        <span className="project-size">
                          WEB
                        </span>

                      </div>

                      <h4>
                        {proyecto.nombre}
                      </h4>

                      <p>
                        {proyecto.descripcion ||
                          'Proyecto desplegado mediante URL.'}
                      </p>

                      {proyecto.etiquetas.length > 0 && (

                        <div className="project-tags">

                          {proyecto.etiquetas
                            .slice(0, 3)
                            .map(
                              (etiqueta) => (
                                <span
                                  key={etiqueta}
                                >
                                  {etiqueta}
                                </span>
                              )
                            )}

                        </div>

                      )}

                      <div className="project-meta">

                        <span
                          title={proyecto.url}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          <Globe size={15} />
                          {proyecto.url}
                        </span>

                        <span>
                          <Calendar
                            size={15}
                          />

                          {formatearFecha(
                            proyecto.created_at
                          )}
                        </span>

                      </div>

                      <div className="project-actions">

                        <button
                          className="project-open"
                          onClick={() =>
                            abrirProyectoUrl(
                              proyecto.url
                            )
                          }
                        >
                          <Rocket size={16} />
                          Abrir
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            eliminarProyectoUrl(
                              proyecto.id
                            )
                          }
                          title="Eliminar proyecto"
                        >
                          <Trash2 size={17} />
                        </button>

                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          </section>

        )}

      </main>

      {/* MODAL */}

      {mostrarModal && (

        <div
          className="modal-overlay"
          onClick={cerrarModal}
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {subiendo ? (

              <div className="upload-loading">

                <div className="upload-loading-icon">
                  <Cloud size={32} />
                </div>

                <h3>
                  Subiendo proyecto...
                </h3>

                <p>
                  Estamos guardando tu proyecto
                  en la nube.
                </p>

                <div className="upload-progress-wrapper">

                  <div className="upload-progress-bar">

                    <div
                      className="upload-progress-fill"
                      style={{
                        width: `${progreso}%`,
                      }}
                    />

                  </div>

                  <strong>
                    {progreso}%
                  </strong>

                </div>

                <span className="upload-loading-info">
                  {progreso >= 100
                    ? '¡Proyecto subido correctamente!'
                    : 'No cierres esta ventana mientras se completa la carga.'}
                </span>

              </div>

            ) : (

              <>

                <div className="modal-header">

                  <div>

                    <span className="section-label">
                      NUEVO PROYECTO
                    </span>

                    <h3>
                      Subir proyecto
                    </h3>

                    <p>
                      Guarda un nuevo proyecto en tu
                      almacenamiento cloud.
                    </p>

                  </div>

                  <button
                    className="modal-close"
                    onClick={cerrarModal}
                    type="button"
                  >
                    <X size={20} />
                  </button>

                </div>

                <form
                  className="project-form"
                  onSubmit={manejarSubida}
                >

                  <div className="form-group">

                    <label>
                      Nombre del proyecto
                    </label>

                    <input
                      type="text"
                      placeholder="Ej. Sistema de ventas"
                      value={nombre}
                      onChange={(e) =>
                        setNombre(e.target.value)
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Descripción
                    </label>

                    <textarea
                      placeholder="Describe brevemente tu proyecto..."
                      value={descripcion}
                      onChange={(e) =>
                        setDescripcion(
                          e.target.value
                        )
                      }
                      rows={3}
                    />

                  </div>

                  <div className="form-row">

                    <div className="form-group">

                      <label>
                        Categoría
                      </label>

                      <select
                        value={categoria}
                        onChange={(e) =>
                          setCategoria(
                            e.target.value
                          )
                        }
                      >

                        <option value="Web">
                          Web
                        </option>

                        <option value="Backend">
                          Backend
                        </option>

                        <option value="Frontend">
                          Frontend
                        </option>

                        <option value="Mobile">
                          Mobile
                        </option>

                        <option value="Cloud">
                          Cloud
                        </option>

                        <option value="Full Stack">
                          Full Stack
                        </option>

                        <option value="Otros">
                          Otros
                        </option>

                      </select>

                    </div>

                    <div className="form-group">

                      <label>
                        Etiquetas
                      </label>

                      <input
                        type="text"
                        placeholder="React, Node, Supabase"
                        value={etiquetas}
                        onChange={(e) =>
                          setEtiquetas(
                            e.target.value
                          )
                        }
                      />

                      <small>
                        Separa las etiquetas con comas.
                      </small>

                    </div>

                  </div>

                  {/* =========================================
                      VERCEL
                      ========================================= */}

                  <div className="form-group">

                    <label>
                      Proyecto desplegado en Vercel
                    </label>

                    <select
                      value={vercelProjectId}
                      onChange={(e) =>
                        setVercelProjectId(
                          e.target.value
                        )
                      }
                    >

                      <option value="">
                        {cargandoVercel
                          ? 'Cargando proyectos de Vercel...'
                          : 'Selecciona un proyecto'}
                      </option>

                      {proyectosVercel.map(
                        (proyectoVercel) => (

                          <option
                            key={proyectoVercel.id}
                            value={
                              proyectoVercel.id
                            }
                          >
                            {proyectoVercel.name}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  {/* =========================================
                      SOLO URL
                      ========================================= */}

                  <div className="form-group">

                    <label>
                      URL del proyecto
                    </label>

                    <div
                      style={{
                        position: 'relative',
                      }}
                    >

                      <Globe
                        size={18}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform:
                            'translateY(-50%)',
                          color: '#64748b',
                        }}
                      />

                      <input
                        type="url"
                        placeholder="https://mi-proyecto.vercel.app"
                        value={urlProyecto}
                        onChange={(e) =>
                          setUrlProyecto(
                            e.target.value
                          )
                        }
                        style={{
                          paddingLeft: '40px',
                        }}
                      />

                    </div>

                    <small>
                      Coloca aquí la URL si quieres
                      guardar el proyecto mediante un
                      enlace.
                    </small>

                  </div>

                  {/* =========================================
                      ARCHIVO ZIP
                      ========================================= */}

                  <div className="form-group">

                    <label>
                      Archivo ZIP
                    </label>

                    <label className="upload-area">

                      <Upload size={27} />

                      <strong>
                        {archivo
                          ? archivo.name
                          : 'Selecciona tu proyecto ZIP'}
                      </strong>

                      <span>
                        {archivo
                          ? `${formatearTamano(
                              archivo.size
                            )} seleccionado`
                          : 'Máximo 50 MB'}
                      </span>

                      <input
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        onChange={(e) =>
                          setArchivo(
                            e.target.files?.[0] ||
                              null
                          )
                        }
                      />

                    </label>

                  </div>

                  <div className="modal-actions">

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={cerrarModal}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        subiendo ||
                        (!urlProyecto.trim() &&
                          (cargandoVercel ||
                            proyectosVercel.length === 0))
                      }
                    >
                      {urlProyecto.trim() ? (
                        <>
                          <Globe size={18} />
                          Guardar URL
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Guardar proyecto
                        </>
                      )}
                    </button>

                  </div>

                </form>

              </>

            )}

          </div>

        </div>

      )}

    </div>
  )
}