class_name ArrowTile
extends Button

var direction_index := 0
var piece_color := Color("#5B7CFF")
var outline_color := Color("#F8FAFC")
var hinted := false


func _ready() -> void:
    text = ""
    flat = true
    focus_mode = Control.FOCUS_NONE
    mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
    resized.connect(queue_redraw)
    queue_redraw()


func configure_visual(index: int, fill: Color, outline: Color) -> void:
    direction_index = index
    piece_color = fill
    outline_color = outline
    queue_redraw()


func set_piece_colors(fill: Color, outline: Color) -> void:
    piece_color = fill
    outline_color = outline
    queue_redraw()


func show_hint_flash() -> void:
    hinted = true
    queue_redraw()
    var tween := create_tween()
    tween.tween_interval(0.62)
    tween.finished.connect(func() -> void:
        hinted = false
        queue_redraw()
    )


func _draw() -> void:
    if size.x <= 2.0 or size.y <= 2.0:
        return
    var side := minf(size.x, size.y)
    var center := size * 0.5
    var directions := [Vector2.RIGHT, Vector2.DOWN, Vector2.LEFT, Vector2.UP]
    var direction: Vector2 = directions[direction_index]
    var perpendicular := Vector2(-direction.y, direction.x)
    var start := center - direction * side * 0.29
    var neck := center + direction * side * 0.10
    var tip := center + direction * side * 0.34
    var wing_center := center + direction * side * 0.06
    var left_wing := wing_center + perpendicular * side * 0.22
    var right_wing := wing_center - perpendicular * side * 0.22
    var shadow := Vector2(0, side * 0.045)
    var shadow_color := Color(0, 0, 0, 0.34)
    var outline := Color.WHITE if hinted else outline_color
    var fill := piece_color.lightened(0.10) if hinted else piece_color

    draw_line(start + shadow, neck + shadow, shadow_color, side * 0.23, true)
    draw_colored_polygon(PackedVector2Array([tip + shadow, left_wing + shadow, right_wing + shadow]), shadow_color)

    draw_line(start, neck, outline, side * 0.22, true)
    draw_circle(start, side * 0.11, outline)
    draw_colored_polygon(PackedVector2Array([tip, left_wing, right_wing]), outline)

    draw_line(start, neck, fill, side * 0.13, true)
    draw_circle(start, side * 0.065, fill)
    var inner_tip := tip - direction * side * 0.045
    var inner_left := left_wing - perpendicular * side * 0.055 + direction * side * 0.035
    var inner_right := right_wing + perpendicular * side * 0.055 + direction * side * 0.035
    draw_colored_polygon(PackedVector2Array([inner_tip, inner_left, inner_right]), fill)

    draw_circle(start - direction * side * 0.15, side * 0.025, Color(outline, 0.42))
    draw_circle(start - direction * side * 0.23, side * 0.016, Color(outline, 0.24))
