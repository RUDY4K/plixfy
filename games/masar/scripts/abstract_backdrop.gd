class_name AbstractBackdrop
extends Control

var base := Color("#F2EFE7")
var primary := Color("#315CF5")


func _ready() -> void:
    mouse_filter = Control.MOUSE_FILTER_IGNORE
    resized.connect(queue_redraw)
    queue_redraw()


func configure(palette: Dictionary) -> void:
    base = palette.bg
    primary = palette.primary
    queue_redraw()


func _draw() -> void:
    draw_rect(Rect2(Vector2.ZERO, size), base)
    draw_rect(Rect2(size.x - 18.0, 0, 18.0, size.y), primary)
