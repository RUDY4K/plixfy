class_name ArrowBoard
extends Control

signal progress_changed(remaining: int, total: int, combo: int, score: int)
signal level_cleared(score: int, best_combo: int)
signal blocked_tap

const DIRECTIONS: Array[Vector2i] = [Vector2i.RIGHT, Vector2i.DOWN, Vector2i.LEFT, Vector2i.UP]
const ARROWS := ["→", "↓", "←", "↑"]
var TILE_COLORS: Array[Color] = [Color("#67E8F9"), Color("#5EEAD4"), Color("#93C5FD"), Color("#A7F3D0")]
var INK := Color("#092033")
var BOARD_BG := Color("#0E2638")
var BOARD_LINE := Color("#5EEAD4")
var FREE_GLOW := Color("#DFFFFA")

@export_range(4, 7, 1) var grid_columns := 4
@export_range(5, 9, 1) var grid_rows := 6
@export_range(4, 40, 1) var tile_target := 8
@export var level_seed := 1

var tiles: Array[Button] = []
var total_tiles := 0
var combo := 0
var best_combo := 0
var score := 0
var mistakes := 0
var input_locked := false
var rng := RandomNumberGenerator.new()


func _ready() -> void:
    custom_minimum_size = Vector2(820, 1080)
    clip_contents = true
    resized.connect(_layout_tiles)
    new_level()


func new_level() -> void:
    for tile in tiles:
        if is_instance_valid(tile):
            tile.queue_free()
    tiles.clear()
    combo = 0
    best_combo = 0
    score = 0
    mistakes = 0
    input_locked = false
    rng.seed = level_seed

    var layout := _generate_layout()
    for item in layout:
        _create_tile(item.cell, item.direction, item.color_index)
    total_tiles = tiles.size()
    _layout_tiles()
    _refresh_tile_states()
    _play_board_entrance()
    _emit_progress()
    queue_redraw()


func configure(columns: int, rows: int, target: int, seed_value: int) -> void:
    grid_columns = clampi(columns, 4, 7)
    grid_rows = clampi(rows, 5, 9)
    tile_target = clampi(target, 4, grid_columns * grid_rows - 1)
    level_seed = seed_value


func apply_palette(palette: Dictionary) -> void:
    TILE_COLORS.clear()
    for color in palette.tiles:
        TILE_COLORS.append(color)
    INK = palette.ink
    BOARD_BG = palette.panel.darkened(0.18)
    BOARD_LINE = Color(palette.primary, 0.66)
    FREE_GLOW = palette.text
    if is_node_ready():
        _refresh_tile_states()
        queue_redraw()


func show_hint() -> void:
    for tile in tiles:
        if _is_free(tile):
            tile.pivot_offset = tile.size * 0.5
            var tween := create_tween()
            tween.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
            tween.tween_property(tile, "scale", Vector2.ONE * 1.08, 0.14)
            tween.tween_property(tile, "scale", Vector2.ONE, 0.16)
            _floating_feedback(tile.position + tile.size * 0.5, "OPEN PATH", FREE_GLOW)
            return


func has_free_move() -> bool:
    for tile in tiles:
        if _is_free(tile):
            return true
    return false


func get_remaining() -> int:
    return tiles.size()


func get_mistakes() -> int:
    return mistakes


func solve_step_for_test() -> bool:
    for tile in tiles.duplicate():
        if _is_free(tile):
            tiles.erase(tile)
            tile.queue_free()
            return true
    return false


func _generate_layout() -> Array[Dictionary]:
    var best: Array[Dictionary] = []
    for attempt in range(24):
        var occupied: Dictionary = {}
        var result: Array[Dictionary] = []
        while result.size() < tile_target:
            var candidates: Array[Dictionary] = []
            for row in range(grid_rows):
                for column in range(grid_columns):
                    var cell := Vector2i(column, row)
                    if occupied.has(cell):
                        continue
                    for direction_index in range(DIRECTIONS.size()):
                        if _ray_clear_in_map(cell, DIRECTIONS[direction_index], occupied):
                            candidates.append({
                                "cell": cell,
                                "direction": direction_index,
                                "color_index": (result.size() + direction_index) % TILE_COLORS.size(),
                            })
            if candidates.is_empty():
                break
            var choice: Dictionary = candidates[rng.randi_range(0, candidates.size() - 1)]
            occupied[choice.cell] = true
            result.append(choice)
        if result.size() > best.size():
            best = result
        if result.size() == tile_target:
            return result
        rng.seed = level_seed + attempt * 7919
    return best


func _ray_clear_in_map(cell: Vector2i, direction: Vector2i, occupied: Dictionary) -> bool:
    var cursor := cell + direction
    while _inside(cursor):
        if occupied.has(cursor):
            return false
        cursor += direction
    return true


func _create_tile(cell: Vector2i, direction_index: int, color_index: int) -> void:
    var tile := Button.new()
    tile.text = ARROWS[direction_index]
    tile.layout_direction = Control.LAYOUT_DIRECTION_LTR
    tile.focus_mode = Control.FOCUS_NONE
    tile.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
    tile.add_theme_font_size_override("font_size", 60)
    tile.add_theme_color_override("font_color", INK)
    tile.add_theme_color_override("font_pressed_color", INK)
    tile.set_meta("cell", cell)
    tile.set_meta("direction_index", direction_index)
    tile.set_meta("color_index", color_index)
    tile.pressed.connect(_on_tile_pressed.bind(tile))
    add_child(tile)
    tiles.append(tile)


func _on_tile_pressed(tile: Button) -> void:
    if input_locked or not is_instance_valid(tile):
        return
    if not _is_free(tile):
        combo = 0
        mistakes += 1
        blocked_tap.emit()
        _emit_progress()
        _soft_nudge(tile)
        Input.vibrate_handheld(18)
        return

    input_locked = true
    combo += 1
    best_combo = maxi(best_combo, combo)
    var gained := 10 + mini(combo, 10) * 2
    score += gained
    tiles.erase(tile)
    _emit_progress()
    Input.vibrate_handheld(12)

    var direction := DIRECTIONS[int(tile.get_meta("direction_index"))]
    var tile_center := tile.position + tile.size * 0.5
    _create_light_trail(tile_center, direction, TILE_COLORS[int(tile.get_meta("color_index"))])
    _spark_burst(tile_center, TILE_COLORS[int(tile.get_meta("color_index"))])
    if combo >= 3:
        _floating_feedback(tile_center, "FLOW ×%d" % combo, FREE_GLOW)
    else:
        _floating_feedback(tile_center, "+%d" % gained, FREE_GLOW)

    var distance := maxf(size.x, size.y) * 1.25
    var tween := create_tween().set_parallel(true)
    tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
    tween.tween_property(tile, "position", tile.position + Vector2(direction) * distance, 0.22)
    tween.tween_property(tile, "modulate:a", 0.0, 0.17)
    tween.tween_property(tile, "scale", Vector2.ONE * 0.88, 0.22)
    await tween.finished
    tile.queue_free()
    input_locked = false
    _refresh_tile_states()
    if tiles.is_empty():
        Input.vibrate_handheld(70)
        await get_tree().create_timer(0.16).timeout
        level_cleared.emit(score, best_combo)


func _is_free(tile: Button) -> bool:
    var cell: Vector2i = tile.get_meta("cell")
    var direction := DIRECTIONS[int(tile.get_meta("direction_index"))]
    var cursor := cell + direction
    while _inside(cursor):
        for other in tiles:
            if other != tile and other.get_meta("cell") == cursor:
                return false
        cursor += direction
    return true


func _inside(cell: Vector2i) -> bool:
    return cell.x >= 0 and cell.x < grid_columns and cell.y >= 0 and cell.y < grid_rows


func _layout_tiles() -> void:
    if size.x <= 1.0 or size.y <= 1.0:
        return
    var padding := 34.0
    var available := size - Vector2.ONE * padding * 2.0
    var cell_side := minf(available.x / grid_columns, available.y / grid_rows)
    var board_size := Vector2(grid_columns, grid_rows) * cell_side
    var origin := (size - board_size) * 0.5
    var gap := maxf(8.0, cell_side * 0.06)
    for tile in tiles:
        if not is_instance_valid(tile):
            continue
        var cell: Vector2i = tile.get_meta("cell")
        tile.position = origin + Vector2(cell) * cell_side + Vector2.ONE * gap
        tile.size = Vector2.ONE * (cell_side - gap * 2.0)
        tile.pivot_offset = tile.size * 0.5
    queue_redraw()


func _refresh_tile_states() -> void:
    for tile in tiles:
        if not is_instance_valid(tile):
            continue
        var base: Color = TILE_COLORS[int(tile.get_meta("color_index"))]
        var free := _is_free(tile)
        tile.modulate = Color.WHITE if free else Color(0.82, 0.86, 0.92, 1.0)
        tile.add_theme_stylebox_override("normal", _tile_style(base if free else base.darkened(0.12), FREE_GLOW if free else base.lightened(0.08), free))
        tile.add_theme_stylebox_override("hover", _tile_style(base.lightened(0.06), Color.WHITE, true))
        tile.add_theme_stylebox_override("pressed", _tile_style(base.darkened(0.08), FREE_GLOW, true))


func _play_board_entrance() -> void:
    for index in range(tiles.size()):
        var tile := tiles[index]
        tile.modulate.a = 0.0
        tile.scale = Vector2.ONE * 0.88
        var tween := create_tween().set_parallel(true)
        tween.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
        var delay := minf(index * 0.018, 0.16)
        tween.tween_property(tile, "scale", Vector2.ONE, 0.22).set_delay(delay)
        tween.tween_property(tile, "modulate:a", 1.0, 0.16).set_delay(delay)


func _soft_nudge(tile: Button) -> void:
    var origin := tile.position
    var tween := create_tween()
    tween.set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
    tween.tween_property(tile, "position", origin + Vector2(6, 0), 0.055)
    tween.tween_property(tile, "position", origin - Vector2(5, 0), 0.07)
    tween.tween_property(tile, "position", origin, 0.065)


func _create_light_trail(start: Vector2, direction: Vector2i, color: Color) -> void:
    var end := start + Vector2(direction) * maxf(size.x, size.y) * 0.75
    var glow := Line2D.new()
    glow.points = PackedVector2Array([start, end])
    glow.width = 18
    glow.default_color = Color(color, 0.18)
    glow.antialiased = true
    add_child(glow)
    move_child(glow, 0)
    var line := Line2D.new()
    line.points = PackedVector2Array([start, end])
    line.width = 4
    line.default_color = Color(FREE_GLOW, 0.65)
    line.antialiased = true
    add_child(line)
    move_child(line, 1)
    var tween := create_tween().set_parallel(true)
    tween.tween_property(glow, "modulate:a", 0.0, 0.28)
    tween.tween_property(line, "modulate:a", 0.0, 0.22)
    tween.finished.connect(func() -> void:
        glow.queue_free()
        line.queue_free()
    )


func _spark_burst(center: Vector2, color: Color) -> void:
    for index in range(6):
        var spark := ColorRect.new()
        spark.color = color.lightened(0.12)
        spark.size = Vector2(8, 8)
        spark.position = center - spark.size * 0.5
        spark.mouse_filter = Control.MOUSE_FILTER_IGNORE
        add_child(spark)
        var angle := TAU * float(index) / 6.0
        var target := spark.position + Vector2.from_angle(angle) * 42.0
        var tween := create_tween().set_parallel(true)
        tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
        tween.tween_property(spark, "position", target, 0.26)
        tween.tween_property(spark, "modulate:a", 0.0, 0.26)
        tween.tween_property(spark, "scale", Vector2.ONE * 0.35, 0.26)
        tween.finished.connect(spark.queue_free)


func _floating_feedback(center: Vector2, value: String, color: Color) -> void:
    var label := Label.new()
    label.text = value
    label.position = center - Vector2(135, 42)
    label.size = Vector2(270, 84)
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    label.add_theme_font_size_override("font_size", 30)
    label.add_theme_color_override("font_color", color)
    label.add_theme_constant_override("outline_size", 6)
    label.add_theme_color_override("font_outline_color", Color(0.02, 0.06, 0.12, 0.82))
    label.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(label)
    var tween := create_tween().set_parallel(true)
    tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
    tween.tween_property(label, "position:y", label.position.y - 58.0, 0.42)
    tween.tween_property(label, "modulate:a", 0.0, 0.42).set_delay(0.12)
    tween.finished.connect(label.queue_free)


func _tile_style(background: Color, border: Color, highlighted: bool) -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = background
    style.border_color = border
    style.set_border_width_all(4 if highlighted else 2)
    style.set_corner_radius_all(22)
    style.shadow_color = Color(border, 0.20) if highlighted else Color(0, 0, 0, 0.28)
    style.shadow_size = 12 if highlighted else 6
    return style


func _emit_progress() -> void:
    progress_changed.emit(tiles.size(), total_tiles, combo, score)


func _draw() -> void:
    var panel := StyleBoxFlat.new()
    panel.bg_color = BOARD_BG
    panel.border_color = BOARD_LINE
    panel.set_border_width_all(4)
    panel.set_corner_radius_all(38)
    panel.shadow_color = Color(0, 0, 0, 0.42)
    panel.shadow_size = 18
    draw_style_box(panel, Rect2(Vector2.ZERO, size))

    var spacing := 68.0
    var dot_color := Color(0.39, 0.61, 0.68, 0.075)
    var y := spacing
    while y < size.y - spacing:
        var x := spacing
        while x < size.x - spacing:
            draw_circle(Vector2(x, y), 2.2, dot_color)
            x += spacing
        y += spacing
