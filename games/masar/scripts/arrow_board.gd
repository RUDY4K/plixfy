class_name ArrowBoard
extends Control

signal progress_changed(remaining: int, total: int, combo: int, score: int)
signal level_cleared(score: int, best_combo: int)
signal blocked_tap

const DIRECTIONS: Array[Vector2i] = [Vector2i.RIGHT, Vector2i.DOWN, Vector2i.LEFT, Vector2i.UP]
const ARROWS := ["→", "↓", "←", "↑"]
const TILE_COLORS := [Color("#E9B95C"), Color("#1FD6D0"), Color("#D88C4A"), Color("#88C7B7")]
const BOARD_BG := Color("#071225")
const BOARD_LINE := Color("#9B672A")

@export_range(4, 7, 1) var grid_columns := 4
@export_range(5, 9, 1) var grid_rows := 6
@export_range(4, 40, 1) var tile_target := 8
@export var level_seed := 1

var tiles: Array[Button] = []
var total_tiles := 0
var combo := 0
var best_combo := 0
var score := 0
var input_locked := false
var rng := RandomNumberGenerator.new()


func _ready() -> void:
    custom_minimum_size = Vector2(820, 1080)
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
    input_locked = false
    rng.seed = level_seed

    var layout := _generate_layout()
    for item in layout:
        _create_tile(item.cell, item.direction, item.color_index)
    total_tiles = tiles.size()
    _layout_tiles()
    _emit_progress()
    queue_redraw()


func configure(columns: int, rows: int, target: int, seed_value: int) -> void:
    grid_columns = clampi(columns, 4, 7)
    grid_rows = clampi(rows, 5, 9)
    tile_target = clampi(target, 4, grid_columns * grid_rows - 1)
    level_seed = seed_value


func show_hint() -> void:
    for tile in tiles:
        if _is_free(tile):
            var original_scale := tile.scale
            tile.pivot_offset = tile.size * 0.5
            var tween := create_tween()
            tween.set_loops(2)
            tween.tween_property(tile, "scale", original_scale * 1.1, 0.16)
            tween.tween_property(tile, "scale", original_scale, 0.16)
            return


func has_free_move() -> bool:
    for tile in tiles:
        if _is_free(tile):
            return true
    return false


func get_remaining() -> int:
    return tiles.size()


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
    tile.add_theme_font_size_override("font_size", 58)
    tile.add_theme_color_override("font_color", Color("#071225"))
    tile.add_theme_color_override("font_pressed_color", Color("#071225"))
    tile.add_theme_stylebox_override("normal", _tile_style(TILE_COLORS[color_index], TILE_COLORS[color_index].lightened(0.22)))
    tile.add_theme_stylebox_override("hover", _tile_style(TILE_COLORS[color_index].lightened(0.08), Color.WHITE))
    tile.add_theme_stylebox_override("pressed", _tile_style(TILE_COLORS[color_index].darkened(0.08), Color("#FFF7E7")))
    tile.set_meta("cell", cell)
    tile.set_meta("direction_index", direction_index)
    tile.pressed.connect(_on_tile_pressed.bind(tile))
    add_child(tile)
    tiles.append(tile)


func _on_tile_pressed(tile: Button) -> void:
    if input_locked or not is_instance_valid(tile):
        return
    if not _is_free(tile):
        combo = 0
        blocked_tap.emit()
        _emit_progress()
        _shake(tile)
        Input.vibrate_handheld(22)
        return

    input_locked = true
    combo += 1
    best_combo = maxi(best_combo, combo)
    score += 10 + mini(combo, 10) * 2
    tiles.erase(tile)
    _emit_progress()
    Input.vibrate_handheld(14)

    var direction := DIRECTIONS[int(tile.get_meta("direction_index"))]
    var distance := maxf(size.x, size.y) * 1.25
    var tween := create_tween().set_parallel(true)
    tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
    tween.tween_property(tile, "position", tile.position + Vector2(direction) * distance, 0.22)
    tween.tween_property(tile, "modulate:a", 0.0, 0.18)
    tween.tween_property(tile, "scale", Vector2.ONE * 0.82, 0.22)
    await tween.finished
    tile.queue_free()
    input_locked = false
    if tiles.is_empty():
        Input.vibrate_handheld(90)
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
    var padding := 28.0
    var available := size - Vector2.ONE * padding * 2.0
    var cell_side := minf(available.x / grid_columns, available.y / grid_rows)
    var board_size := Vector2(grid_columns, grid_rows) * cell_side
    var origin := (size - board_size) * 0.5
    var gap := maxf(7.0, cell_side * 0.055)
    for tile in tiles:
        if not is_instance_valid(tile):
            continue
        var cell: Vector2i = tile.get_meta("cell")
        tile.position = origin + Vector2(cell) * cell_side + Vector2.ONE * gap
        tile.size = Vector2.ONE * (cell_side - gap * 2.0)
        tile.pivot_offset = tile.size * 0.5
    queue_redraw()


func _shake(tile: Button) -> void:
    var origin := tile.position
    var tween := create_tween()
    tween.tween_property(tile, "position", origin + Vector2(12, 0), 0.05)
    tween.tween_property(tile, "position", origin - Vector2(12, 0), 0.06)
    tween.tween_property(tile, "position", origin + Vector2(7, 0), 0.05)
    tween.tween_property(tile, "position", origin, 0.05)


func _tile_style(background: Color, border: Color) -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = background
    style.border_color = border
    style.set_border_width_all(3)
    style.set_corner_radius_all(18)
    style.shadow_color = Color(0, 0, 0, 0.35)
    style.shadow_size = 8
    return style


func _emit_progress() -> void:
    progress_changed.emit(tiles.size(), total_tiles, combo, score)


func _draw() -> void:
    var panel := StyleBoxFlat.new()
    panel.bg_color = BOARD_BG
    panel.border_color = BOARD_LINE
    panel.set_border_width_all(5)
    panel.set_corner_radius_all(34)
    panel.shadow_color = Color(0, 0, 0, 0.5)
    panel.shadow_size = 18
    draw_style_box(panel, Rect2(Vector2.ZERO, size))
