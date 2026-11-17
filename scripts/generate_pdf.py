import os
import sys
from PIL import Image as PILImage
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PDF_PATH = "B:/Workspace/booking-app/public/Dossier_StarbNails_Sistema_y_Panel.pdf"
ASSETS_DIR = "B:/Workspace/booking-app/public/pdf_assets"

# Colores de marca
COLOR_NARANJA = colors.HexColor("#FF5500")      # Naranja X vibrante
COLOR_CIRUELA = colors.HexColor("#523450")      # Ciruela StarbNails
COLOR_CREMA = colors.HexColor("#FAF5EA")        # Fondo vintage
COLOR_AMARILLO = colors.HexColor("#FFD15C")     # Acento amarillo vintage
COLOR_DARK = colors.HexColor("#1A1A1A")         # Texto principal
COLOR_MUTED = colors.HexColor("#555555")        # Texto secundario
COLOR_CARD_BG = colors.HexColor("#F8F9FA")      # Fondo tarjetas
COLOR_EMERALD = colors.HexColor("#059669")      # Verde éxito / WhatsApp
COLOR_LINE = colors.HexColor("#E2E8F0")

class NumberedCanvas(canvas.Canvas):
    """Canvas de dos pasadas para imprimir 'Página X de Y' y decoraciones de cabecera/pie."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        w, h = A4

        # Encabezado superior (a partir de página 2)
        if self._pageNumber > 1:
            self.setStrokeColor(COLOR_LINE)
            self.setLineWidth(0.75)
            self.line(36, h - 30, w - 36, h - 30)

            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(COLOR_CIRUELA)
            self.drawString(36, h - 24, "STARBNAILS")

            self.setFont("Helvetica", 8)
            self.setFillColor(COLOR_MUTED)
            self.drawString(102, h - 24, "· Sistema de Turnos & Panel Administrativo Fintech")

            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(COLOR_NARANJA)
            self.drawRightString(w - 36, h - 24, "ESTILO NARANJA X")

        # Pie de página (en todas las páginas)
        self.setStrokeColor(COLOR_LINE)
        self.setLineWidth(0.75)
        self.line(36, 32, w - 36, 32)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(COLOR_MUTED)
        self.drawString(36, 20, "Documento Técnico y Manual de Funcionalidades · Salón StarbNails")

        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(w - 36, 20, page_text)

        self.restoreState()


def build_pdf():
    # A4 = 595.27 x 841.89 pt. Con márgenes de 36 pt (0.5 in), ancho utilizable = 523.27 pt
    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Tipografías personalizadas
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=COLOR_CIRUELA,
        alignment=0
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=COLOR_NARANJA,
        alignment=0
    )

    h1_style = ParagraphStyle(
        "Heading1_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=COLOR_CIRUELA,
        spaceAfter=6
    )

    h2_style = ParagraphStyle(
        "Heading2_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=COLOR_NARANJA,
        spaceBefore=6,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        "Body_Custom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=COLOR_DARK,
        spaceAfter=5
    )

    body_bold = ParagraphStyle(
        "BodyBold_Custom",
        parent=body_style,
        fontName="Helvetica-Bold"
    )

    caption_style = ParagraphStyle(
        "Caption_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=COLOR_MUTED,
        alignment=1
    )

    badge_style = ParagraphStyle(
        "Badge_Custom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1
    )

    story = []

    # =========================================================================
    # PÁGINA 1: PORTADA & RESUMEN EJECUTIVO
    # =========================================================================
    # Encabezado visual decorativo tipo banner
    header_table_data = [
        [
            Paragraph("<b>STARBNAILS</b>", ParagraphStyle("H1B", fontName="Helvetica-Bold", fontSize=26, leading=28, textColor=colors.HexColor("#523450"))),
            Paragraph("<b>PANEL FINTECH</b><br/><font size='8' color='#666666'>ESTILO NARANJA X</font>", ParagraphStyle("H1R", fontName="Helvetica-Bold", fontSize=14, leading=16, textColor=COLOR_NARANJA, alignment=2))
        ]
    ]
    t_header = Table(header_table_data, colWidths=[300, 223])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)

    story.append(HRFlowable(width="100%", thickness=3, color=COLOR_NARANJA, spaceAfter=14, spaceBefore=4))

    story.append(Paragraph("Dossier del Sistema: Aplicación Responsive & Panel de Administración", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Manual Integral de Arquitectura, Funcionalidades Actuales y Visión Modular de Gestión", subtitle_style))
    story.append(Spacer(1, 12))

    # Tarjeta de Datos Técnicos
    meta_box = [
        [
            Paragraph("<b>Ecosistema:</b> Salón de Uñas StarbNails", body_style),
            Paragraph("<b>Despliegue:</b> Netlify Serverless (Producción)", body_style)
        ],
        [
            Paragraph("<b>Web Pública:</b> Estética Rubber Hose 1930s (Zero-Scroll)", body_style),
            Paragraph("<b>Panel Administrativo:</b> Fintech Naranja X (#FF5500)", body_style)
        ],
        [
            Paragraph("<b>Motor de Agenda:</b> Google Calendar API v3", body_style),
            Paragraph("<b>Seguridad Admin:</b> PIN encriptado en LocalStorage móvil", body_style)
        ]
    ]
    t_meta = Table(meta_box, colWidths=[260, 263])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFF7ED")),
        ('BOX', (0,0), (-1,-1), 1.5, COLOR_NARANJA),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_meta)

    story.append(Spacer(1, 14))

    # Resumen Ejecutivo
    story.append(Paragraph("1. Resumen Ejecutivo del Proyecto", h1_style))
    story.append(Paragraph(
        "El sistema StarbNails combina una <b>experiencia pública temática cautivadora</b> para las clientas con un <b>panel de administración privado de nivel fintech</b> diseñado con la exactitud y agilidad de la aplicación <i>Naranja X</i>. Esta arquitectura desacoplada resuelve los dos mayores cuellos de botella de un centro de estética: la pérdida de tiempo respondiendo consultas repetitivas de horarios por WhatsApp y la falta de visibilidad financiera instantánea de las señas y turnos diarios.",
        body_style
    ))
    story.append(Paragraph(
        "Tanto la interfaz de reserva como el panel administrativo son <b>100% responsivos</b>, adaptándose fluidamente a pantallas de celulares, tablets y computadoras de escritorio, garantizando que la dueña del salón pueda operar todo su negocio desde su propio teléfono sin depender de computadoras ni software contable complejo.",
        body_style
    ))

    story.append(Spacer(1, 8))

    # Puntos fuertes destacados en 3 bloques
    highlights_data = [
        [
            Paragraph("<b>🎨 Experiencia Clienta (1930s)</b><br/><font size='8' color='#444'>Diseño cartoon auténtico, flujo compacto en 3 pasos sin scroll vertical forzado, validación instantánea y generación de comprobante con enlace directo a WhatsApp.</font>", body_style),
            Paragraph("<b>📱 Panel Naranja X Privado</b><br/><font size='8' color='#444'>Seguridad por PIN local en el dispositivo de la dueña, métricas de señas cobradas, balance estimado del día, buscador de clientas y botón de contacto en un toque.</font>", body_style),
            Paragraph("<b>⚡ Sincronización Google Calendar</b><br/><font size='8' color='#444'>Bloqueo automático de turnos de 1h 15m, prevención total de sobreturnos, y cancelación bidireccional inmediata en la nube con un solo clic.</font>", body_style),
        ]
    ]
    t_highlights = Table(highlights_data, colWidths=[174, 174, 175])
    t_highlights.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, COLOR_LINE),
        ('INNERGRID', (0,0), (-1,-1), 1, COLOR_LINE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_highlights)

    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 2: PÁGINA PÚBLICA RESPONSIVE (CLIENTA)
    # =========================================================================
    story.append(Paragraph("2. Experiencia de la Clienta: Web de Turnos 100% Responsive", h1_style))
    story.append(Paragraph(
        "La interfaz pública fue concebida bajo la dirección de arte clásica <i>Rubber Hose / Cuphead</i> de los años 30. A diferencia de los formularios web genéricos que requieren scrolls interminables, StarbNails utiliza un <b>Contenedor Único Dinámico (Single-Viewport)</b> que contiene todo el proceso en 3 etapas sin obligar al usuario a desplazarse verticalmente.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # Imágenes comparativas Mobile + Desktop
    img_client_mob_path = os.path.join(ASSETS_DIR, "client_mobile.png")
    img_client_desk_path = os.path.join(ASSETS_DIR, "client_desktop.png")

    client_comparison_data = [
        [
            Paragraph("<b>Versión Móvil (Celular - 390x844)</b>", caption_style),
            Paragraph("<b>Versión Escritorio / Tablet (PC - 1366x768)</b>", caption_style)
        ],
        [
            RLImage(img_client_mob_path, width=140, height=303),
            RLImage(img_client_desk_path, width=360, height=202)
        ]
    ]
    t_client_comp = Table(client_comparison_data, colWidths=[150, 373])
    t_client_comp.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_client_comp)
    story.append(Spacer(1, 8))

    # Desglose de características de la web pública
    features_client = [
        [
            Paragraph("<b>1. Catálogo Real de Servicios:</b><br/>Opciones claras de Semipermanente ($13.000), Kapping ($15.000) y Soft Gel ($16.000), con selector opcional de Retiro de otro salón (+$3.000) que recalcula el importe total automáticamente.", body_style),
            Paragraph("<b>2. Selector Inteligente de Días:</b><br/>Carrusel horizontal de fechas hábiles (Lunes a Sábado, domingos cerrados) con solapas destacadas de 'Hoy' y 'Mañana' sin solapamiento visual ni cortes.", body_style)
        ],
        [
            Paragraph("<b>3. Bloques Horarios de 75 Minutos:</b><br/>Turnos sincronizados con la disponibilidad real de la dueña (Lu/Vi desde 17:00, Ma/Ju desde 18:30, Mi/Sá desde 16:00). Incluye canal directo a WhatsApp para excepciones previas a las 16 hs.", body_style),
            Paragraph("<b>4. Confirmación con Telón Vintage:</b><br/>Transición de obturador animado en tono ciruela (#523450) que se cierra mientras se agenda el turno en Google Calendar y se abre revelando el Comprobante Oficial.", body_style)
        ],
        [
            Paragraph("<b>5. Botón 'Para finalizar, contactame':</b><br/>Abre el chat de WhatsApp oficial (3804949550) con el mensaje redactado y estructurado con todos los datos de la cita y la seña de $5.000 requerida.", body_style),
            Paragraph("<b>6. Compartir Comprobante Nativo:</b><br/>Botón secundario que permite a la clienta compartir su tarjeta de turno por cualquier red social o guardarlo en su galería.", body_style)
        ]
    ]
    t_feat_client = Table(features_client, colWidths=[256, 267])
    t_feat_client.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, COLOR_LINE),
        ('INNERGRID', (0,0), (-1,-1), 1, COLOR_LINE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_feat_client)

    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 3: PANEL ADMINISTRADOR NARANJA X (FLUJO MÓVIL)
    # =========================================================================
    story.append(Paragraph("3. Panel de Administración: Identidad y Flujo Móvil Naranja X", h1_style))
    story.append(Paragraph(
        "El panel administrativo (ruta privada <b>/admin</b>) replica la identidad visual, tipográfica y de microinteracciones de <b>Naranja X</b>: cabecera naranja (#FF5500) con bordes redondeados profundos, tarjetas flotantes con sombras suaves, formato de transacciones financieras y navegación ágil pensada para manejarse con una sola mano.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # 3 Pantallas móviles side-by-side
    img_pin_path = os.path.join(ASSETS_DIR, "admin_pin_mobile.png")
    img_dash_mob_path = os.path.join(ASSETS_DIR, "admin_dashboard_mobile.png")
    img_modal_path = os.path.join(ASSETS_DIR, "admin_detail_modal.png")

    admin_screens_data = [
        [
            Paragraph("<b>1. Acceso Seguro con PIN</b>", caption_style),
            Paragraph("<b>2. Dashboard Financiero & Lista</b>", caption_style),
            Paragraph("<b>3. Ficha Clienta & WhatsApp</b>", caption_style)
        ],
        [
            RLImage(img_pin_path, width=155, height=335),
            RLImage(img_dash_mob_path, width=155, height=335),
            RLImage(img_modal_path, width=155, height=335)
        ],
        [
            Paragraph("<font size='7.5' color='#555'>El PIN de 4 dígitos se almacena en el <i>localStorage</i> del celular de la dueña. Nadie externo puede acceder.</font>", caption_style),
            Paragraph("<font size='7.5' color='#555'>Métricas en grande: señas del día, facturación estimada, turnos de la semana y lista ordenada tipo transferencias.</font>", caption_style),
            Paragraph("<font size='7.5' color='#555'>Modal inferior al tocar cualquier turno: botón verde de WhatsApp con mensaje listo y botón para cancelar el turno en 1 toque.</font>", caption_style)
        ]
    ]
    t_admin_screens = Table(admin_screens_data, colWidths=[174, 174, 175])
    t_admin_screens.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_admin_screens)
    story.append(Spacer(1, 8))

    # Explicación detallada de las 3 fases
    admin_detail_table = [
        [
            Paragraph("<b>Autenticación Local (LocalStorage)</b><br/>No requiere registrarse en servicios externos ni recordar contraseñas largas. La primera vez que la dueña entra define un PIN de 4 dígitos que se guarda localmente en su navegador móvil. Si cierra la pestaña, su sesión queda protegida.", body_style),
            Paragraph("<b>Panel de Control Financiero (Balance)</b><br/>Calcula automáticamente la suma total de señas recaudadas de los turnos de hoy ($5.000 por turno) y la facturación total esperada. Permite prever los ingresos de los próximos 7 días con un solo vistazo.", body_style)
        ],
        [
            Paragraph("<b>Filtros Rápidos & Buscador Inteligente</b><br/>Pestañas estilo 'Pills' (Hoy, Esta Semana, Todos) más barra de búsqueda predictiva en tiempo real que filtra por nombre de clienta, tipo de servicio o número de teléfono celular.", body_style),
            Paragraph("<b>Acciones Operativas Instantáneas</b><br/>Al tocar a una clienta se despliega el menú inferior con enlace directo para escribirle a su WhatsApp (con texto de cortesía listo) o cancelar el turno en Google Calendar si la clienta no asiste.", body_style)
        ]
    ]
    t_admin_detail = Table(admin_detail_table, colWidths=[256, 267])
    t_admin_detail.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, COLOR_LINE),
        ('INNERGRID', (0,0), (-1,-1), 1, COLOR_LINE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_admin_detail)

    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 4: PANEL EN ESCRITORIO (PC/TABLET)
    # =========================================================================
    story.append(Paragraph("4. Panel de Administración en Escritorio y Tablets", h1_style))
    story.append(Paragraph(
        "Cuando la dueña o recepcionista abre el panel <b>/admin</b> desde una computadora o tablet en el salón, la interfaz aprovecha el ancho completo manteniendo el diseño Naranja X limpio y espacioso. Permite tener a la vista la agenda de toda la jornada sin amontonar elementos.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # Imagen Desktop del Panel Admin
    img_dash_desk_path = os.path.join(ASSETS_DIR, "admin_dashboard_desktop.png")
    story.append(Paragraph("<b>Vista Panorámica de Escritorio (1366 x 768)</b>", caption_style))
    story.append(Spacer(1, 2))
    story.append(RLImage(img_dash_desk_path, width=520, height=292))
    story.append(Spacer(1, 8))

    desktop_features = [
        [
            Paragraph("<b>Operativa de Salón en Tiempo Real</b><br/>Ideal para dejar abierto en una tablet o notebook sobre el mostrador de manicuría. Al confirmar un turno una clienta desde su celular, el botón de actualización recarga la lista instantáneamente.", body_style),
            Paragraph("<b>Control de Señas y Asistencias</b><br/>Visualización del balance financiero consolidado del día ($ señas) y de los próximos 7 días para proyectar compras de insumos semanales.", body_style)
        ],
        [
            Paragraph("<b>Búsqueda Rápida de Historial</b><br/>Escribiendo el nombre de una clienta o los últimos dígitos de su celular, el panel filtra en milisegundos toda su actividad reciente.", body_style),
            Paragraph("<b>Gestión de Horarios y Disponibilidad</b><br/>Permite identificar huecos libres en la agenda diaria para acomodar turnos espontáneos o reasignar horarios cancelados.", body_style)
        ]
    ]
    t_desk_feat = Table(desktop_features, colWidths=[256, 267])
    t_desk_feat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, COLOR_LINE),
        ('INNERGRID', (0,0), (-1,-1), 1, COLOR_LINE),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_desk_feat)

    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 5: MODULARIDAD Y TODO LO QUE PUEDE TENER A FUTURO
    # =========================================================================
    story.append(Paragraph("5. Modularidad & Potencial de Expansión del Panel", h1_style))
    story.append(Paragraph(
        "El panel administrativo fue desarrollado con una arquitectura modular en Next.js y React. Esto significa que <b>no es solo una agenda</b>, sino que puede convertirse progresivamente en el <b>sistema operativo completo del salón</b> incorporando nuevos módulos según crezca el negocio:",
        body_style
    ))
    story.append(Spacer(1, 6))

    future_modules = [
        [
            Paragraph("<b>📦 1. Control de Stock e Inventario de Insumos</b>", h2_style),
            Paragraph("Registro de frascos de esmaltes, geles kapping, tips de soft gel, limas, aceites y removedores. Alerta automática cuando un color o insumo baja del umbral mínimo de seguridad.", body_style)
        ],
        [
            Paragraph("<b>📋 2. Ficha Técnica y Clínica de Clientas</b>", h2_style),
            Paragraph("Perfil individual por clienta con historial de visitas, fotos de diseños anteriores, notas de alergias a componentes, largo favorito y preferencias estéticas para una atención personalizada.", body_style)
        ],
        [
            Paragraph("<b>📊 3. Estadísticas Avanzadas & Contabilidad</b>", h2_style),
            Paragraph("Gráficos de facturación mensual, ingresos netos vs. gastos de materiales, servicio más rentable (ej. Kapping vs. Soft Gel), horas pico de mayor afluencia y exportación de reportes a Excel o PDF.", body_style)
        ],
        [
            Paragraph("<b>🏷️ 4. Gestión Dinámica de Precios y Promociones</b>", h2_style),
            Paragraph("Panel para modificar precios de servicios al instante sin tocar código, crear cupones de descuento, combos especiales ('Manos + Pies') o programas de fidelización ('10mo servicio gratis').", body_style)
        ],
        [
            Paragraph("<b>💳 5. Integración con Pasarelas de Pago Digitales</b>", h2_style),
            Paragraph("Cobro automático de señas mediante Mercado Pago, Modo o transferencia con comprobante adjunto. El turno solo se confirma tras la validación exitosa de la transferencia.", body_style)
        ],
        [
            Paragraph("<b>🚫 6. Bloqueo de Días, Feriados y Vacaciones</b>", h2_style),
            Paragraph("Botón rápido para bloquear jornadas completas o franjas horarias específicas (por capacitaciones, eventos o descanso personal) sin necesidad de entrar manualmente a Google Calendar.", body_style)
        ],
        [
            Paragraph("<b>⏰ 7. Recordatorios Automatizados Anti-Ausencias</b>", h2_style),
            Paragraph("Envío automático de notificaciones por WhatsApp 24 horas y 2 horas antes de la cita, reduciendo las inasistencias o cancelaciones imprevistas a menos del 3%.", body_style)
        ],
        [
            Paragraph("<b>👥 8. Soporte Multiprofesional y Comisiones</b>", h2_style),
            Paragraph("Capacidad de agregar múltiples manicuristas o especialistas en pestañas/cejas, cada una con su propia agenda independiente, cálculo automático de comisiones y panel individual.", body_style)
        ]
    ]

    t_modules = Table(future_modules, colWidths=[180, 343])
    t_modules.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, COLOR_LINE),
        ('INNERGRID', (0,0), (-1,-1), 0.75, COLOR_LINE),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_modules)

    story.append(Spacer(1, 10))

    # Conclusión final
    conclusion_box = [
        [
            Paragraph("<b>💡 Conclusión y Recomendación:</b><br/>El sistema actual ya brinda una ventaja competitiva enorme: profesionaliza la imagen del salón, garantiza el cobro de la seña, ahorra horas de atención en WhatsApp y ofrece a la dueña un panel bancario intuitivo y seguro en su propio celular. Su base técnica permite habilitar cualquiera de estos módulos futuros sin alterar el funcionamiento actual.", body_style)
        ]
    ]
    t_conclusion = Table(conclusion_box, colWidths=[523])
    t_conclusion.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FEF3C7")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#D97706")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_conclusion)

    # Construir documento con NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {PDF_PATH}")

if __name__ == "__main__":
    build_pdf()
