class_name AbstractBackdrop
extends Control

var base := Color("#101735")
var primary := Color("#5B7CFF")
var phase := 0.0


func _ready() -> void:
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    resized.connect(queue_redraw)
    set_process(true)
    queue_redraw()


func _process(delta: float) -> void:
    phase = fmod(phase + delta * 0.18, TAU)
    queue_redraw()


func configure(palette: Dictionary) -> void:
    base = palette.bg
    primary = palette.primary
    queue_redraw()


func _draw() -> void:
    draw_rect(Rect2(Vector2.ZERO, size), base)
    var orbit_center := Vector2(size.x * 0.5, size.y * 0.38)
    for ring in range(4):
        draw_arc(orbit_center, 230.0 + ring * 92.0, 0.0, TAU, 96, Color(primary, 0.055), 7.0, true)

    for index in range(24):
        var ratio_x := fmod(float(index * 47), 101.0) / 101.0
        var ratio_y := fmod(float(index * 83), 97.0) / 97.0
        var drift := Vector2(sin(phase + index) * 7.0, cos(phase * 0.8 + index) * 9.0)
        var point := Vector2(ratio_x * size.x, ratio_y * size.y) + drift
        var radius := 2.0 + float(index % 3)
        draw_circle(point, radius, Color(primary, 0.18 if index % 4 == 0 else 0.09))

    var square_size := 52.0
    for index in range(5):
        var center := Vector2(size.x * (0.08 + index * 0.22), size.y * (0.18 + (index % 2) * 0.52))
        draw_rect(Rect2(center - Vector2.ONE * square_size * 0.5, Vector2.ONE * square_size), Color(primary, 0.045), false, 5.0)
