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
    var bands := 20
    for index in range(bands):
        var ratio := float(index) / float(bands - 1)
        var color := base.lerp(surface.darkened(0.18), ratio)
        draw_rect(Rect2(0, ratio * size.y, size.x, size.y / bands + 1.0), color)

    var grid_color := Color(primary, 0.026)
    var grid_step := 96.0
    var x := 0.0
    while x < size.x:
        draw_line(Vector2(x, 0), Vector2(x, size.y), grid_color, 1.0)
        x += grid_step
    var y := 0.0
    while y < size.y:
        draw_line(Vector2(0, y), Vector2(size.x, y), grid_color, 1.0)
        y += grid_step

    var path := PackedVector2Array([
        Vector2(-40, size.y * 0.16),
        Vector2(size.x * 0.19, size.y * 0.16),
        Vector2(size.x * 0.19, size.y * 0.31),
        Vector2(size.x * 0.78, size.y * 0.31),
        Vector2(size.x * 0.78, size.y * 0.52),
        Vector2(size.x * 0.35, size.y * 0.52),
        Vector2(size.x * 0.35, size.y * 0.76),
        Vector2(size.x + 40, size.y * 0.76),
    ])
    draw_polyline(path, Color(primary, 0.055), 30.0, true)
    draw_polyline(path, Color(primary, 0.20), 3.0, true)

    for point_index in [1, 2, 3, 4, 5, 6]:
        var point: Vector2 = path[point_index]
        draw_circle(point, 10.0, Color(base, 0.92))
        draw_circle(point, 5.0, Color(accent, 0.48))

    draw_circle(Vector2(size.x * 0.91, size.y * 0.08), 4.0, Color(accent, 0.42))
    draw_circle(Vector2(size.x * 0.08, size.y * 0.88), 3.0, Color(primary, 0.30))
