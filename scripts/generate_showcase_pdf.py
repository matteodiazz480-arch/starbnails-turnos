import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PDF_PATH = "B:/Workspace/booking-app/public/StarbNails_Flujo_Turnos.pdf"
ASSETS_DIR = "B:/Workspace/booking-app/public/flow_captures"

# Paleta StarbNails
COLOR_CIRUELA = colors.HexColor("#523450")
COLOR_AMARILLO = colors.HexColor("#FFD15C")
COLOR_DARK = colors.HexColor("#1A1A1A")
COLOR_MUTED = colors.HexColor("#555555")
COLOR_CARD_BG = colors.HexColor("#FDFBF7")
COLOR_BORDER = colors.HexColor("#000000")
COLOR_GOOGLE_BLUE = colors.HexColor("#1A73E8")

class NumberedCanvas(canvas.Canvas):
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

        # Encabezado superior en todas las páginas
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(30, h - 24, w - 30, h - 24)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLOR_CIRUELA)
        self.drawString(30, h - 18, "STARBNAILS")

        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(COLOR_GOOGLE_BLUE)
        self.drawString(95, h - 18, "• VINCULADO DIRECTO A GOOGLE CALENDAR (TIEMPO REAL)")

        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(COLOR_DARK)
        self.drawRightString(w - 30, h - 18, "DISEÑO 100% RESPONSIVE · RUBBER HOSE 1930s")

        # Pie de página
        self.line(30, 22, w - 30, 22)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(COLOR_MUTED)
        self.drawString(30, 12, "StarbNails · Sistema Automatizado de Reserva de Turnos Online")
        self.drawRightString(w - 30, 12, f"Página {self._pageNumber} de {page_count}")

        self.restoreState()


def build_pdf():
    # A4: 595.27 x 841.89 pt. Márgenes de 30 pt -> Ancho = 535 pt
    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=A4,
        leftMargin=30,
        rightMargin=30,
        topMargin=32,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=21,
        textColor=COLOR_CIRUELA,
        alignment=0
    )

    badge_google = ParagraphStyle(
        "BadgeGoogle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1
    )

    caption_title = ParagraphStyle(
        "CaptionTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=COLOR_CIRUELA,
        alignment=1
    )

    caption_desc = ParagraphStyle(
        "CaptionDesc",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=COLOR_MUTED,
        alignment=1
    )

    story = []

    # =========================================================================
    # PÁGINA 1: ETAPA 1 Y ETAPA 2 (CON DESKTOP Y MOBILE)
    # =========================================================================
    # Header Banner con Aclaración Google Calendar
    header_data = [
        [
            Paragraph("<b>STARBNAILS · FLUJO DE RESERVA RESPONSIVE</b>", title_style),
            Paragraph(
                "<font color='#ffffff'><b>✓ VINCULADO A GOOGLE CALENDAR</b></font>",
                ParagraphStyle("GCBadge", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=colors.white, alignment=2)
            )
        ]
    ]
    t_top = Table(header_data, colWidths=[335, 200])
    t_top.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_top)

    # Barra informativa Google Calendar
    info_banner = [
        [
            Paragraph(
                "<b>Sincronización en Tiempo Real:</b> Cada turno seleccionado consulta la disponibilidad en vivo en Google Calendar, bloqueando el horario de forma inmediata y evitando cualquier posibilidad de sobreturnos.",
                ParagraphStyle("InfoText", fontName="Helvetica", fontSize=8, leading=10.5, textColor=colors.HexColor("#0f172a"))
            )
        ]
    ]
    t_banner = Table(info_banner, colWidths=[535])
    t_banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EBF3FE")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BFDBFE")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_banner)
    story.append(Spacer(1, 8))

    # Comparativa Principal: Desktop vs Mobile (Paso 1)
    img_desk_p1 = os.path.join(ASSETS_DIR, "step1_services_desktop.png")
    img_mob_p1 = os.path.join(ASSETS_DIR, "step1_services_mobile.png")

    p1_comp_data = [
        [
            Paragraph("<b>Versión Celular (Mobile)</b>", caption_title),
            Paragraph("<b>Versión Computadora / Tablet (Desktop)</b>", caption_title)
        ],
        [
            RLImage(img_mob_p1, width=135, height=292),
            RLImage(img_desk_p1, width=385, height=216)
        ],
        [
            Paragraph("<b>ETAPA 1:</b> Selección de Servicio (Precios reales y seña)", caption_desc),
            Paragraph("Diseño adaptable sin scroll forzado con mascota anfitriona y botones elásticos", caption_desc)
        ]
    ]
    t_p1 = Table(p1_comp_data, colWidths=[145, 390])
    t_p1.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_p1)
    story.append(Spacer(1, 10))

    # Etapa 1 Seleccionada y Etapa 2 (Día y Horarios) en Móvil Side-by-Side
    img_mob_p1_sel = os.path.join(ASSETS_DIR, "step1_selected_mobile.png")
    img_mob_p2 = os.path.join(ASSETS_DIR, "step2_datetime_mobile.png")

    p2_data = [
        [
            Paragraph("<b>ETAPA 1 (Adicional Retiro)</b>", caption_title),
            Paragraph("<b>ETAPA 2: Día y Horario (Google Calendar)</b>", caption_title)
        ],
        [
            RLImage(img_mob_p1_sel, width=160, height=346),
            RLImage(img_mob_p2, width=160, height=346)
        ],
        [
            Paragraph("Cálculo automático de servicio + adicional de retiro", caption_desc),
            Paragraph("Turnos de 1h 15m sincronizados con la agenda de Google", caption_desc)
        ]
    ]
    t_p2 = Table(p2_data, colWidths=[267, 268])
    t_p2.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_p2)

    story.append(PageBreak())

    # =========================================================================
    # PÁGINA 2: ETAPA 3, ETAPA 4, ETAPA 5 (COMPROBANTE + DESKTOP)
    # =========================================================================
    story.append(Paragraph("<b>ETAPAS DE CONFIRMACIÓN Y COMPROBANTE OFICIAL</b>", title_style))
    story.append(Spacer(1, 2))

    # Banner Google Calendar en página 2
    info_banner_p2 = [
        [
            Paragraph(
                "<b>Integración Oficial:</b> Al presionar 'Confirmar mi Turno', se crea el evento automáticamente en la cuenta de Google Calendar vinculada (annap98.apb@gmail.com) con recordatorios y datos completos de la clienta.",
                ParagraphStyle("InfoText2", fontName="Helvetica", fontSize=8, leading=10.5, textColor=colors.HexColor("#0f172a"))
            )
        ]
    ]
    t_banner2 = Table(info_banner_p2, colWidths=[535])
    t_banner2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EBF3FE")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BFDBFE")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_banner2)
    story.append(Spacer(1, 8))

    # Tres etapas en móvil: Paso 3 (Formulario), Paso 4 (Shutter Loading), Paso 5 (Ticket)
    img_mob_p3 = os.path.join(ASSETS_DIR, "step3_form_mobile.png")
    img_mob_p4 = os.path.join(ASSETS_DIR, "step4_shutter_mobile.png")
    img_mob_p5 = os.path.join(ASSETS_DIR, "step5_ticket_mobile.png")

    p345_data = [
        [
            Paragraph("<b>ETAPA 3: Datos de Contacto</b>", caption_title),
            Paragraph("<b>ETAPA 4: Bloqueo en Google Calendar</b>", caption_title),
            Paragraph("<b>ETAPA 5: Comprobante de Cita</b>", caption_title)
        ],
        [
            RLImage(img_mob_p3, width=155, height=335),
            RLImage(img_mob_p4, width=155, height=335),
            RLImage(img_mob_p5, width=155, height=335)
        ],
        [
            Paragraph("Nombre, WhatsApp y observaciones", caption_desc),
            Paragraph("Telón 1930s mientras se agenda", caption_desc),
            Paragraph("Seña, botón WhatsApp y compartir", caption_desc)
        ]
    ]
    t_p345 = Table(p345_data, colWidths=[178, 178, 179])
    t_p345.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_p345)
    story.append(Spacer(1, 10))

    # Comprobante en Desktop
    img_desk_p5 = os.path.join(ASSETS_DIR, "step5_ticket_desktop.png")
    p5_desk_data = [
        [
            Paragraph("<b>Comprobante Oficial en Computadora / Tablet (Escritorio)</b>", caption_title)
        ],
        [
            RLImage(img_desk_p5, width=520, height=292)
        ],
        [
            Paragraph("Muestra el ticket oficial confirmado, el sello 'Reserva Lista', y las opciones de WhatsApp y compartir", caption_desc)
        ]
    ]
    t_p5_desk = Table(p5_desk_data, colWidths=[535])
    t_p5_desk.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_p5_desk)

    doc.build(story, canvasmaker=NumberedCanvas)
    print("Showcase PDF successfully generated at:", PDF_PATH)

if __name__ == "__main__":
    build_pdf()
