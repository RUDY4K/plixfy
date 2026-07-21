class_name AbstractBackdrop
extends Control

var base := Color("#071A2B")
var surface := Color("#0E2638")
var primary := Color("#5EEAD4")
var accent := Color("#93C5FD")


func _ready() -> void:
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    resized.connect(queue_redraw)
    queue_redraw()


func configure(palette: Dictionary) -> void:
    base = palette.bg
    surface = palette.panel
    primary = palette.primary
    accent = palette.accent
    queue_redraw()


func _draw() -> void:
    draw_rect(Rect2(Vector2.ZERO, size), base)

    var bands := 24
    for index in range(bands):
        var ratio := float(index) / float(bands - 1)
        var band_color := base.lerp(surface.darkened(0.12), ratio)
        var band_height := size.y / float(bands) + 1.0
        draw_rect(Rect2(0, ratio * size.y, size.x, band_height), band_color)

    draw_circle(Vector2(size.x * 0.88, size.y * 0.10), size.x * 0.55, Color(primary, 0.07))
    draw_circle(Vector2(size.x * 0.08, size.y * 0.72), size.x * 0.62, Color(accent, 0.055))
    draw_circle(Vector2(size.x * 0.55, size.y * 1.02), size.x * 0.72, Color(primary, 0.035))

    var ribbon_one := PackedVector2Array([
        Vector2(-80, size.y * 0.26),
        Vector2(size.x * 0.62, size.y * 0.13),
        Vector2(size.x + 100, size.y * 0.22),
        Vector2(size.x + 100, size.y * 0.27),
        Vector2(size.x * 0.58, size.y * 0.19),
        Vector2(-80, size.y * 0.32),
    ])
    draw_colored_polygon(ribbon_one, Color(primary, 0.035))

    var ribbon_two := PackedVector2Array([
        Vector2(-120, size.y * 0.76),
        Vector2(size.x * 0.38, size.y * 0.66),
        Vector2(size.x + 120, size.y * 0.78),
        Vector2(size.x + 120, size.y * 0.83),
        Vector2(size.x * 0.34, size.y * 0.72),
        Vector2(-120, size.y * 0.82),
    ])
    draw_colored_polygon(ribbon_two, Color(accent, 0.025))

    var stars := [
        Vector2(0.09, 0.10), Vector2(0.18, 0.18), Vector2(0.31, 0.08),
        Vector2(0.72, 0.16), Vector2(0.90, 0.30), Vector2(0.12, 0.42),
        Vector2(0.82, 0.52), Vector2(0.22, 0.63), Vector2(0.68, 0.78),
        Vector2(0.91, 0.88), Vector2(0.42, 0.91), Vector2(0.06, 0.84),
    ]
    for star in stars:
        draw_circle(Vector2(star.x * size.x, star.y * size.y), 3.0, Color(1.0, 1.0, 1.0, 0.10))
